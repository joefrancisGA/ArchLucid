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
        string requestUri =
            $"https://graph.microsoft.com/v1.0/groups/{Uri.EscapeDataString(groupId)}/members?$select=id";

        using HttpRequestMessage request = new(HttpMethod.Get, requestUri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using HttpResponseMessage response = await httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

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

        List<AzureInventoryEntraGroupMembershipRow> memberships = [];

        if (parsed?.Value is null)
        {
            return new EntraGroupMembershipGraphReadResult
            {
                Memberships = memberships,
            };
        }

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
                EvidenceHashSha256 = AzureInventoryEntraGroupMembershipParser.ComputeDefaultEvidenceHash(member.Id, groupId),
            });
        }

        return new EntraGroupMembershipGraphReadResult
        {
            Memberships = memberships,
            NestedGroupIds = parsed.Value
                .Where(static member => member.IsGroup && !string.IsNullOrWhiteSpace(member.Id))
                .Select(static member => member.Id!.Trim())
                .ToList(),
        };
    }

    private sealed class GraphMembersResponse
    {
        public List<GraphDirectoryObject>? Value
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
