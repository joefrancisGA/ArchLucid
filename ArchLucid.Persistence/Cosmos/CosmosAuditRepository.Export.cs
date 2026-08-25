using System.Runtime.CompilerServices;
using System.Text;

using ArchLucid.Core.Audit;

using Microsoft.Azure.Cosmos;

namespace ArchLucid.Persistence.Cosmos;

public sealed partial class CosmosAuditRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<AuditEvent>> GetExportAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime fromUtc,
        DateTime toUtc,
        int maxRows,
        CancellationToken ct)
    {
        int take = Math.Clamp(maxRows <= 0 ? 10_000 : maxRows, 1, 10_000);
        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        string tid = tenantId.ToString("D");
        string wid = workspaceId.ToString("D");
        string pid = projectId.ToString("D");
        string fromIso = CosmosAuditFilterPredicateBuilder.FormatUtcIso(fromUtc);
        string toIso = CosmosAuditFilterPredicateBuilder.FormatUtcIso(toUtc);

        QueryDefinition query = new QueryDefinition(
                """
                SELECT * FROM c
                WHERE c.workspaceId = @wid AND c.projectId = @pid
                  AND c.occurredUtc >= @fromUtc AND c.occurredUtc < @toUtc
                ORDER BY c.occurredUtc ASC, c.id ASC
                """)
            .WithParameter("@wid", wid)
            .WithParameter("@pid", pid)
            .WithParameter("@fromUtc", fromIso)
            .WithParameter("@toUtc", toIso);

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

        return list;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AuditEvent>> GetFilteredExportAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        CancellationToken ct)
    {
        List<AuditEvent> rows = [];

        await foreach (AuditEvent row in StreamFilteredExportAsync(tenantId, workspaceId, projectId, filter, ct))
            rows.Add(row);

        return rows;
    }

    /// <inheritdoc />
    public async IAsyncEnumerable<AuditEvent> StreamFilteredExportAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        [EnumeratorCancellation] CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(filter);

        if (filter.BeforeUtc.HasValue || filter.BeforeEventId.HasValue)
        {
            throw new ArgumentException(
                "Filtered export does not support keyset cursor fields.",
                nameof(filter));
        }

        int take = Math.Clamp(filter.Take <= 0 ? 10_000 : filter.Take, 1, 10_000);
        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        string tid = tenantId.ToString("D");
        string wid = workspaceId.ToString("D");
        string pid = projectId.ToString("D");

        QueryDefinition query = BuildSelectFilteredExportQuery(wid, pid, filter);

        using FeedIterator<AuditEventDocument> iterator = container.GetItemQueryIterator<AuditEventDocument>(
            query,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(tid), MaxItemCount = take });

        int emitted = 0;

        while (iterator.HasMoreResults && emitted < take)
        {
            FeedResponse<AuditEventDocument> page = await iterator.ReadNextAsync(ct);

            foreach (AuditEventDocument doc in page)
            {
                yield return CosmosAuditDocumentMapper.ToEvent(doc);
                emitted++;

                if (emitted >= take)
                    yield break;
            }
        }
    }

    private static QueryDefinition BuildSelectFilteredExportQuery(string wid, string pid, AuditEventFilter filter)
    {
        StringBuilder sql = new(
            """
            SELECT * FROM c
            WHERE c.workspaceId = @wid AND c.projectId = @pid
            """);

        List<KeyValuePair<string, object?>> parameters =
        [
            new("@wid", wid),
            new("@pid", pid)
        ];

        CosmosAuditFilterPredicateBuilder.Append(sql, parameters, filter);
        sql.Append(" ORDER BY c.occurredUtc ASC, c.id ASC");

        QueryDefinition query = new(sql.ToString());

        foreach (KeyValuePair<string, object?> pair in parameters)
            query = query.WithParameter(pair.Key, pair.Value!);

        return query;
    }
}
