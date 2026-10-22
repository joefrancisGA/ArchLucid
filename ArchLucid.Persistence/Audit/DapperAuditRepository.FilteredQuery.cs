using System.Diagnostics;
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
    public async Task<IReadOnlyList<AuditEvent>> GetByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken ct)
    {
        // Read-committed + row-versioning (RCSI): consistent committed reads without dirty-read hints; enable via migration 091.
        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(ct);
            IEnumerable<AuditEvent> rows = await connection.QueryAsync<AuditEvent>(
                new CommandDefinition(
                    HotPathRelationalQueryShapes.AuditEventsGetByScopeNoLock,
                    new
                    {
                        TenantId = tenantId,
                        WorkspaceId = workspaceId,
                        ProjectId = projectId,
                        Take = Math.Clamp(take <= 0 ? 100 : take, 1, 500)
                    },
                    cancellationToken: ct));

            return AuditEventListProjection.MaterializeWithoutDataJson(rows);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.ListAuditEventsByScope,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    public async Task<IReadOnlyList<AuditEvent>> GetFilteredAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(filter);

        int take = Math.Clamp(filter.Take <= 0 ? 100 : filter.Take, 1, 500);

        // RCSI-backed read committed: no dirty reads on audit listing (see migration 091).
        string selectPrefix = filter.IncludeDataJson
            ? HotPathRelationalQueryShapes.AuditEventsFilteredSelectFromWhereScopeWithDataJsonNoLock
            : HotPathRelationalQueryShapes.AuditEventsFilteredSelectFromWhereScopeNoLock;

        StringBuilder sql = new(selectPrefix);

        DynamicParameters parameters = new();
        parameters.Add("TenantId", tenantId);
        parameters.Add("WorkspaceId", workspaceId);
        parameters.Add("ProjectId", projectId);
        parameters.Add("Take", take);
        AppendSharedAuditFilterClauses(sql, parameters, filter);

        // Raw-string prefix ends at @ProjectId with no trailing newline (delimiter newline is not content); separate ORDER BY.
        sql.AppendLine();
        sql.Append(HotPathRelationalQueryShapes.AuditEventsFilteredOrderByOccurredUtcEventIdDesc.Trim());

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(ct);
            IEnumerable<AuditEvent> rows = await connection.QueryAsync<AuditEvent>(
                new CommandDefinition(sql.ToString(), parameters, cancellationToken: ct));

            if (filter.IncludeDataJson)
                return rows.ToList();

            return AuditEventListProjection.MaterializeWithoutDataJson(rows);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.ListAuditEventsFiltered,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    public async Task<int> CountFilteredAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(filter);

        StringBuilder sql = new(HotPathRelationalQueryShapes.AuditEventsFilteredCountFromWhereScopeNoLock);
        DynamicParameters parameters = new();
        parameters.Add("TenantId", tenantId);
        parameters.Add("WorkspaceId", workspaceId);
        parameters.Add("ProjectId", projectId);
        AppendSharedAuditFilterClauses(sql, parameters, filter);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(ct);
            int count = await connection.ExecuteScalarAsync<int>(
                new CommandDefinition(sql.ToString(), parameters, cancellationToken: ct));

            return count;
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.CountAuditEventsFiltered,
                sw.Elapsed.TotalMilliseconds);
        }
    }
}
