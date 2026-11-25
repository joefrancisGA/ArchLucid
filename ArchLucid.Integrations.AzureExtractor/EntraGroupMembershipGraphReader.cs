using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using Azure.Core;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed class EntraGroupMembershipGraphReader(
    HttpClient httpClient,
    ILogger<EntraGroupMembershipGraphReader> logger) : IEntraGroupMembershipGraphReader
{
    private const int MaxPaginationRequests = 64;

    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<EntraGroupMembershipGraphReadResult> TryReadDirectMembershipsAsync(
        TokenCredential credential,
        IReadOnlyList<string> seedGroupIds,
        int maxNestedDepth,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(credential);
        ArgumentNullException.ThrowIfNull(seedGroupIds);

        if (seedGroupIds.Count == 0)
        {
            return EntraGroupMembershipGraphReadResult.Empty();
        }

        AccessToken accessToken = await credential
            .GetTokenAsync(
                new TokenRequestContext([EntraGroupMembershipGraphScopes.GraphDefaultScope]),
                cancellationToken)
            .ConfigureAwait(false);

        List<AzureInventoryEntraGroupMembershipRow> rows = [];
        HashSet<string> warnings = new(StringComparer.OrdinalIgnoreCase);
        bool anySuccessfulGroup = false;
        HashSet<string> visitedGroups = new(StringComparer.OrdinalIgnoreCase);
        Queue<(string GroupId, int Depth)> pending = new();

        foreach (string seedGroupId in seedGroupIds.Where(static id => !string.IsNullOrWhiteSpace(id)))
        {
            pending.Enqueue((seedGroupId.Trim(), 0));
        }

        while (pending.Count > 0)
        {
            (string groupId, int depth) = pending.Dequeue();

            if (!visitedGroups.Add(groupId))
            {
                continue;
            }

            EntraGroupMembershipGraphReadResult pageResult = await ReadGroupMembersPageAsync(
                accessToken.Token,
                groupId,
                cancellationToken).ConfigureAwait(false);

            warnings.UnionWith(pageResult.Warnings);
            rows.AddRange(pageResult.Memberships);
            if (!pageResult.Forbidden)
                anySuccessfulGroup = true;

            if (depth >= maxNestedDepth)
            {
                if (pageResult.NestedGroupIds.Any(id => !visitedGroups.Contains(id)))
                    warnings.Add(SecurityEvidenceEntraGroupAdapterWarnings.GraphIncomplete);

                continue;
            }

            foreach (string nestedGroupId in pageResult.NestedGroupIds)
            {
                pending.Enqueue((nestedGroupId, depth + 1));
            }
        }

        return new EntraGroupMembershipGraphReadResult
        {
            Memberships = rows,
            Forbidden = !anySuccessfulGroup && warnings.Contains(SecurityEvidenceEntraGroupAdapterWarnings.GraphForbidden),
            Warnings = warnings.OrderBy(static warning => warning, StringComparer.Ordinal).ToArray(),
        };
    }

    private async Task<EntraGroupMembershipGraphReadResult> ReadGroupMembersPageAsync(
        string accessToken,
        string groupId,
        CancellationToken cancellationToken)
    {
        List<AzureInventoryEntraGroupMembershipRow> memberships = [];
        List<string> nestedGroupIds = [];
        HashSet<string> warnings = new(StringComparer.OrdinalIgnoreCase);
        string? nextLink =
            $"https://graph.microsoft.com/v1.0/groups/{Uri.EscapeDataString(groupId)}/members?$select=id";
        HashSet<string> visitedLinks = new(StringComparer.Ordinal);
        bool forbidden = false;
        bool receivedPage = false;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (visitedLinks.Count >= MaxPaginationRequests || !visitedLinks.Add(nextLink))
            {
                warnings.Add(SecurityEvidenceEntraGroupAdapterWarnings.GraphIncomplete);
                break;
            }

            try
            {
                EnsureNextLinkTargetsGroup(nextLink, groupId);
                using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                using HttpResponseMessage response =
                    await httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

                if (response.StatusCode == HttpStatusCode.Forbidden)
                {
                    forbidden = !receivedPage;
                    warnings.Add(SecurityEvidenceEntraGroupAdapterWarnings.GraphForbidden);
                    break;
                }

                if (!response.IsSuccessStatusCode)
                {
                    logger.LogWarning("Entra group collection failed with HTTP {StatusCode}.", (int)response.StatusCode);
                    warnings.Add(SecurityEvidenceEntraGroupAdapterWarnings.GraphIncomplete);
                    break;
                }

                await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
                GraphMembersResponse? parsed = await JsonSerializer.DeserializeAsync<GraphMembersResponse>(
                    stream, SerializerOptions, cancellationToken).ConfigureAwait(false);

                if (parsed?.Value is null)
                {
                    warnings.Add(SecurityEvidenceEntraGroupAdapterWarnings.GraphIncomplete);
                    break;
                }

                receivedPage = true;
                foreach (GraphDirectoryObject? member in parsed.Value)
                {
                    if (member is null || string.IsNullOrWhiteSpace(member.Id))
                    {
                        warnings.Add(SecurityEvidenceEntraGroupAdapterWarnings.GraphIncomplete);
                        continue;
                    }

                    memberships.Add(new AzureInventoryEntraGroupMembershipRow
                    {
                        MemberId = member.Id.Trim(),
                        GroupId = groupId,
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                        EvidenceHashSha256 = AzureInventoryEntraGroupMembershipParser.ComputeDefaultEvidenceHash(
                            member.Id, groupId),
                    });

                    if (member.IsGroup)
                        nestedGroupIds.Add(member.Id.Trim());
                }

                nextLink = parsed.ODataNextLink;
                if (nextLink is not null)
                    EnsureNextLinkTargetsGroup(nextLink, groupId);
            }
            catch (Exception exception) when (exception is HttpRequestException or IOException or JsonException or InvalidOperationException or ArgumentException
                || (exception is OperationCanceledException && !cancellationToken.IsCancellationRequested))
            {
                logger.LogWarning("Entra group collection was interrupted ({FailureType}).", exception.GetType().Name);
                warnings.Add(SecurityEvidenceEntraGroupAdapterWarnings.GraphIncomplete);
                break;
            }
        }

        return new EntraGroupMembershipGraphReadResult
        {
            Forbidden = forbidden,
            Memberships = memberships,
            NestedGroupIds = nestedGroupIds,
            Warnings = warnings.OrderBy(static warning => warning, StringComparer.Ordinal).ToArray(),
        };
    }

    private static void EnsureNextLinkTargetsGroup(string nextLink, string groupId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextLink);
        ArgumentException.ThrowIfNullOrWhiteSpace(groupId);

        if (!Uri.TryCreate(nextLink, UriKind.Absolute, out Uri? uri))
        {
            throw new InvalidOperationException(
                "Entra group membership Graph read stopped due to an invalid @odata.nextLink.");
        }

        if (!uri.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Entra group membership Graph read stopped because @odata.nextLink must use HTTPS.");
        }

        if (!EntraGroupMembershipGraphTrustedHosts.IsTrusted(uri.Host)
            || !uri.Host.Equals("graph.microsoft.com", StringComparison.OrdinalIgnoreCase)
            || !uri.IsDefaultPort || !string.IsNullOrEmpty(uri.UserInfo))
        {
            throw new InvalidOperationException(
                "Entra group membership Graph read stopped because @odata.nextLink targets an untrusted host.");
        }

        const string groupsPathPrefix = "/v1.0/groups/";

        if (!uri.AbsolutePath.StartsWith(groupsPathPrefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Entra group membership Graph read stopped because @odata.nextLink is not a group members URL.");
        }

        ReadOnlySpan<char> remainder = uri.AbsolutePath.AsSpan(groupsPathPrefix.Length);
        int slashIndex = remainder.IndexOf('/');

        if (slashIndex < 0)
        {
            throw new InvalidOperationException(
                "Entra group membership Graph read stopped because @odata.nextLink is not a group members URL.");
        }

        ReadOnlySpan<char> nextGroupId = remainder[..slashIndex];
        ReadOnlySpan<char> collectionSegment = remainder[(slashIndex + 1)..];

        if (nextGroupId.IsEmpty
            || !string.Equals(nextGroupId.ToString(), groupId.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Entra group membership Graph read stopped because @odata.nextLink targets a different group.");
        }

        if (!collectionSegment.Equals("members", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Entra group membership Graph read stopped because @odata.nextLink is not a group members URL.");
        }
    }

    private sealed class GraphMembersResponse
    {
        public List<GraphDirectoryObject>? Value
        {
            get;
            set;
        }

        [System.Text.Json.Serialization.JsonPropertyName("@odata.nextLink")]
        public string? ODataNextLink
        {
            get;
            set;
        }
    }

    private sealed class GraphDirectoryObject
    {
        public string? Id
        {
            get;
            set;
        }

        [System.Text.Json.Serialization.JsonPropertyName("@odata.type")]
        public string? ODataType
        {
            get;
            set;
        }

        public bool IsGroup =>
            string.Equals(ODataType, "#microsoft.graph.group", StringComparison.OrdinalIgnoreCase);
    }
}
