using System.Text;

using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Audit;

using Microsoft.Azure.Cosmos;

namespace ArchLucid.Persistence.Cosmos;

public sealed partial class CosmosAuditRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<AuditEvent>> GetByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken ct)
    {
        int clamped = Math.Clamp(take <= 0 ? 100 : take, 1, 500);
        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        string tid = tenantId.ToString("D");
        string wid = workspaceId.ToString("D");
        string pid = projectId.ToString("D");

        QueryDefinition query = new QueryDefinition(
                $"""
                {BuildListSelectClause(includeDataJson: false)}
                WHERE c.workspaceId = @wid AND c.projectId = @pid
                ORDER BY c.occurredUtc DESC, c.id DESC
                """)
            .WithParameter("@wid", wid)
            .WithParameter("@pid", pid);

        using FeedIterator<AuditEventDocument> iterator = container.GetItemQueryIterator<AuditEventDocument>(
            query,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(tid), MaxItemCount = clamped });

        List<AuditEvent> list = [];

        while (iterator.HasMoreResults && list.Count < clamped)
        {
            FeedResponse<AuditEventDocument> page = await iterator.ReadNextAsync(ct);

            foreach (AuditEventDocument doc in page)
            {
                list.Add(CosmosAuditDocumentMapper.ToEvent(doc));

                if (list.Count >= clamped)
                    break;
            }
        }

        return AuditEventListProjection.MaterializeWithoutDataJson(list);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AuditEvent>> GetFilteredAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(filter);

        int take = Math.Clamp(filter.Take <= 0 ? 100 : filter.Take, 1, 500);
        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        string tid = tenantId.ToString("D");
        string wid = workspaceId.ToString("D");
        string pid = projectId.ToString("D");

        QueryDefinition query = BuildSelectFilteredQuery(wid, pid, filter);

        using FeedIterator<AuditEventDocument> iterator = container.GetItemQueryIterator<AuditEventDocument>(
            query,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(tid), MaxItemCount = take });

        List<AuditEvent> list = [];

        while (iterator.HasMoreResults && list.Count < take)
        {
            FeedResponse<AuditEventDocument> page = await iterator.ReadNextAsync(ct);

            foreach (AuditEventDocument doc in page)
            {
                list.Add(CosmosAuditDocumentMapper.ToEvent(doc));

                if (list.Count >= take)
                    break;
            }
        }

        if (filter.IncludeDataJson)
            return list;

        return AuditEventListProjection.MaterializeWithoutDataJson(list);
    }

    /// <inheritdoc />
    public async Task<int> CountFilteredAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(filter);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        string tid = tenantId.ToString("D");
        string wid = workspaceId.ToString("D");
        string pid = projectId.ToString("D");

        QueryDefinition query = BuildCountFilteredQuery(wid, pid, filter);

        using FeedIterator<int> iterator = container.GetItemQueryIterator<int>(
            query,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(tid), MaxItemCount = 1 });

        int total = 0;

        while (iterator.HasMoreResults)
        {
            FeedResponse<int> page = await iterator.ReadNextAsync(ct);

            total += page.Sum();
        }

        return total;
    }

    /// <summary>
    /// List queries omit <c>dataJson</c> unless the caller needs payloads (SQL list path already projects without DataJson).
    /// </summary>
    private static string BuildListSelectClause(bool includeDataJson)
    {
        if (includeDataJson)
            return "SELECT * FROM c";

        // Scalar fields for ToEvent / AuditEventDocument — exclude dataJson to cut RU and payload size.
        return """
            SELECT c.id, c.tenantId, c.workspaceId, c.projectId, c.occurredUtc, c.eventType,
                   c.actorUserId, c.actorUserName, c.explicitActor, c.runId, c.manifestId,
                   c.artifactId, c.correlationId
            FROM c
            """;
    }

    private static QueryDefinition BuildSelectFilteredQuery(string wid, string pid, AuditEventFilter filter)
    {
        StringBuilder sql = new();
        sql.Append(BuildListSelectClause(filter.IncludeDataJson));
        sql.Append(
            """
            
            WHERE c.workspaceId = @wid AND c.projectId = @pid
            """);

        List<KeyValuePair<string, object?>> parameters =
        [
            new("@wid", wid),
            new("@pid", pid)
        ];

        CosmosAuditFilterPredicateBuilder.Append(sql, parameters, filter);
        sql.Append(" ORDER BY c.occurredUtc DESC, c.id DESC");

        QueryDefinition query = new(sql.ToString());

        foreach (KeyValuePair<string, object?> pair in parameters)
            query = query.WithParameter(pair.Key, pair.Value!);

        return query;
    }

    private static QueryDefinition BuildCountFilteredQuery(string wid, string pid, AuditEventFilter filter)
    {
        StringBuilder sql = new(
            """
            SELECT VALUE COUNT(1) FROM c
            WHERE c.workspaceId = @wid AND c.projectId = @pid
            """);

        List<KeyValuePair<string, object?>> parameters =
        [
            new("@wid", wid),
            new("@pid", pid)
        ];

        CosmosAuditFilterPredicateBuilder.Append(sql, parameters, filter);

        QueryDefinition query = new(sql.ToString());

        foreach (KeyValuePair<string, object?> pair in parameters)
            query = query.WithParameter(pair.Key, pair.Value!);

        return query;
    }
}
