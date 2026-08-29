using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Text;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Telemetry;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Audit;

public sealed partial class DapperAuditRepository
{
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

        // Export uses the same committed-read semantics as list/filter (RCSI when enabled).
        const string sql = """
                           SELECT TOP (@MaxRows)
                               EventId, OccurredUtc, EventType,
                               ActorUserId, ActorUserName,
                               TenantId, WorkspaceId, ProjectId,
                               RunId, ManifestId, ArtifactId,
                               DataJson, CorrelationId
                           FROM dbo.AuditEvents
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND OccurredUtc >= @FromUtc
                             AND OccurredUtc < @ToUtc
                           ORDER BY OccurredUtc ASC;
                           """;

        await using SqlConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<AuditEvent> rows = await connection.QueryAsync<AuditEvent>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    FromUtc = fromUtc,
                    ToUtc = toUtc,
                    MaxRows = take
                },
                cancellationToken: ct));

        return rows.ToList();
    }

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

    public async IAsyncEnumerable<AuditEvent> StreamFilteredExportAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        [EnumeratorCancellation] CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(filter);
        ValidateFilteredExportFilter(filter);

        int take = Math.Clamp(filter.Take <= 0 ? 10_000 : filter.Take, 1, 10_000);
        StringBuilder sql = new(HotPathRelationalQueryShapes.AuditEventsFilteredSelectFromWhereScopeWithDataJsonNoLock);
        DynamicParameters parameters = new();
        parameters.Add("TenantId", tenantId);
        parameters.Add("WorkspaceId", workspaceId);
        parameters.Add("ProjectId", projectId);
        parameters.Add("Take", take);
        AppendSharedAuditFilterClauses(sql, parameters, filter);
        sql.AppendLine();
        sql.Append(HotPathRelationalQueryShapes.AuditEventsFilteredOrderByOccurredUtcEventIdAsc.Trim());
        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(ct);

            await foreach (AuditEvent row in connection
                               .QueryUnbufferedAsync<AuditEvent>(sql.ToString(), parameters)
                               .WithCancellation(ct))
                yield return row;
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.ListAuditEventsFiltered,
                sw.Elapsed.TotalMilliseconds);
        }
    }
}
