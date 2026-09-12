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

            if (pageResult.Forbidden)
            {
                return pageResult;
            }

            rows.AddRange(pageResult.Memberships);

            if (depth >= maxNestedDepth)
            {
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
        };
    }

    private async Task<EntraGroupMembershipGraphReadResult> ReadGroupMembersPageAsync(
        string accessToken,
        string groupId,
        CancellationToken cancellationToken)
    {
        List<AzureInventoryEntraGroupMembershipRow> memberships = [];
        List<string> nestedGroupIds = [];
        string? nextLink =
            $"https://graph.microsoft.com/v1.0/groups/{Uri.EscapeDataString(groupId)}/members?$select=id";
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                logger.LogWarning(
                    "Entra group membership Graph read stopped for group {GroupId} due to repeating @odata.nextLink.",
                    groupId);

                break;
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                logger.LogWarning(
                    "Entra group membership Graph read stopped for group {GroupId} after {MaxPages} pages.",
                    groupId,
                    MaxPaginationRequests);

                break;
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (response.StatusCode == HttpStatusCode.Forbidden)
            {
                logger.LogWarning(
                    "Entra group membership Graph read returned 403 for group {GroupId}. Required scope: {Scope}.",
                    groupId,
                    EntraGroupMembershipGraphScopes.PreferredScope);

                return EntraGroupMembershipGraphReadResult.ForbiddenResult(
                    SecurityEvidenceEntraGroupAdapterWarnings.GraphForbidden);
            }

            if (!response.IsSuccessStatusCode)
            {
                string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

                logger.LogWarning(
                    "Entra group membership Graph read failed for group {GroupId} with status {StatusCode}: {Body}",
                    groupId,
                    (int)response.StatusCode,
                    body);

                return EntraGroupMembershipGraphReadResult.Empty();
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
            GraphMembersResponse? parsed = await JsonSerializer.DeserializeAsync<GraphMembersResponse>(
                stream,
                SerializerOptions,
                cancellationToken).ConfigureAwait(false);

            if (parsed?.Value is not null)
            {
                foreach (GraphDirectoryObject member in parsed.Value)
                {
                    if (string.IsNullOrWhiteSpace(member.Id))
                    {
                        continue;
                    }

                    memberships.Add(new AzureInventoryEntraGroupMembershipRow
                    {
                        MemberId = member.Id.Trim(),
                        GroupId = groupId,
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                        EvidenceHashSha256 = AzureInventoryEntraGroupMembershipParser.ComputeDefaultEvidenceHash(
                            member.Id,
                            groupId),
                    });
                }

                nestedGroupIds.AddRange(
                    parsed.Value
                        .Where(static member => member.IsGroup && !string.IsNullOrWhiteSpace(member.Id))
                        .Select(static member => member.Id!.Trim()));
            }

            string? candidateNextLink = parsed?.ODataNextLink;

            if (!string.IsNullOrWhiteSpace(candidateNextLink))
            {
                EnsureNextLinkTargetsGroup(candidateNextLink, groupId);
                nextLink = candidateNextLink;
            }
            else
            {
                nextLink = null;
            }
        }

        return new EntraGroupMembershipGraphReadResult
        {
            Memberships = memberships,
            NestedGroupIds = nestedGroupIds,
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

        const string groupsPathPrefix = "/v1.0/groups/";

        if (!uri.AbsolutePath.StartsWith(groupsPathPrefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Entra group membership Graph read stopped because @odata.nextLink is not a group members URL.");
        }

        ReadOnlySpan<char> remainder = uri.AbsolutePath.AsSpan(groupsPathPrefix.Length);
        int slashIndex = remainder.IndexOf('/');

        ReadOnlySpan<char> nextGroupId = slashIndex < 0
            ? remainder
            : remainder[..slashIndex];

        if (nextGroupId.IsEmpty
            || !string.Equals(nextGroupId.ToString(), groupId.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Entra group membership Graph read stopped because @odata.nextLink targets a different group.");
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
            ODataType?.Contains("group", StringComparison.OrdinalIgnoreCase) == true;
    }
}
