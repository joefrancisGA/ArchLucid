using System.Data.Common;
using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Host.Core.DataConsistency;

public sealed partial class DataConsistencyOrphanProbeExecutor
{
    private async Task ApplyEnforcementAsync(
        DbConnection connection,
        long goldenCount,
        long findingsCount,
        long contextCount,
        long graphCount,
        CancellationToken ct)
    {
        DataConsistencyEnforcementOptions enf = _enforcementOptionsMonitor.CurrentValue;

        if (!DataConsistencyEnforcementPolicy.ShouldEvaluateEnforcement(enf.Mode))
            return;

        int threshold = DataConsistencyEnforcementPolicy.NormalizeAlertThreshold(enf.AlertThreshold);

        if (DataConsistencyEnforcementPolicy.UsesAlertCounters(enf.Mode))
        {
            TryRecordAlert(goldenCount, threshold, "GoldenManifests", "RunId");
            TryRecordAlert(findingsCount, threshold, "FindingsSnapshots", "RunId");
            TryRecordAlert(contextCount, threshold, "ContextSnapshots", "RunId");
            TryRecordAlert(graphCount, threshold, "GraphSnapshots", "RunId");

            await LogTenantOrphanRollupWhenAlertingAsync(
                    connection,
                    enf.Mode,
                    goldenCount,
                    threshold,
                    "GoldenManifests",
                    "RunId",
                    DataConsistencyOrphanTenantBreakdownSql.GoldenManifestsByTenant,
                    ct)
                .ConfigureAwait(false);

            await LogTenantOrphanRollupWhenAlertingAsync(
                    connection,
                    enf.Mode,
                    findingsCount,
                    threshold,
                    "FindingsSnapshots",
                    "RunId",
                    DataConsistencyOrphanTenantBreakdownSql.FindingsSnapshotsByTenant,
                    ct)
                .ConfigureAwait(false);

            await LogTenantOrphanRollupWhenAlertingAsync(
                    connection,
                    enf.Mode,
                    contextCount,
                    threshold,
                    "ContextSnapshots",
                    "RunId",
                    DataConsistencyOrphanTenantBreakdownSql.ContextSnapshotsByTenant,
                    ct)
                .ConfigureAwait(false);
        }

        int cap = Math.Clamp(enf.MaxRowsPerBatch, 1, 5000);

        await TryInsertQuarantineBatchAsync(
                connection,
                DataConsistencyEnforcementPolicy.ShouldAttemptGoldenManifestQuarantine(enf.Mode, enf.AutoQuarantine, goldenCount),
                DataConsistencyEnforcementSql.InsertOrphanGoldenManifestsMissingRun,
                cap,
                "GoldenManifests",
                "RunId",
                ct)
            .ConfigureAwait(false);

        await TryInsertQuarantineBatchAsync(
                connection,
                DataConsistencyEnforcementPolicy.ShouldAttemptFindingsSnapshotQuarantine(
                    enf.Mode,
                    enf.AutoQuarantine,
                    findingsCount),
                DataConsistencyEnforcementSql.InsertOrphanFindingsSnapshotsMissingRun,
                cap,
                "FindingsSnapshots",
                "RunId",
                ct)
            .ConfigureAwait(false);
    }

    private async Task TryInsertQuarantineBatchAsync(
        DbConnection connection,
        bool shouldAttempt,
        string insertSql,
        int maxRows,
        string tableTag,
        string columnTag,
        CancellationToken ct)
    {
        if (!shouldAttempt)
            return;

        await using DbCommand command = connection.CreateCommand();
        command.CommandText = insertSql;
        DbParameter maxRowsParameter = command.CreateParameter();
        maxRowsParameter.ParameterName = "@MaxRows";
        maxRowsParameter.Value = maxRows;
        command.Parameters.Add(maxRowsParameter);

        int inserted = await command.ExecuteNonQueryAsync(ct).ConfigureAwait(false);

        if (inserted <= 0)
            return;

        ArchLucidInstrumentation.DataConsistencyOrphansQuarantined.Add(
            inserted,
            new KeyValuePair<string, object?>("table", tableTag),
            new KeyValuePair<string, object?>("column", columnTag));

        _logger.LogWarning(
            "Data consistency quarantine inserted {Inserted} orphan {Table} row(s).",
            inserted,
            tableTag);
    }

    private async Task LogTenantOrphanRollupWhenAlertingAsync(
        DbConnection connection,
        DataConsistencyEnforcementMode mode,
        long count,
        int threshold,
        string table,
        string column,
        string breakdownSql,
        CancellationToken ct)
    {
        if (count < threshold)
            return;

        if (mode != DataConsistencyEnforcementMode.Alert && mode != DataConsistencyEnforcementMode.Quarantine)
            return;

        if (!_logger.IsEnabled(LogLevel.Warning))
            return;

        List<string> parts = [];

        await using (DbCommand command = connection.CreateCommand())
        {
            command.CommandText = breakdownSql;
            DbParameter topN = command.CreateParameter();
            topN.ParameterName = "@TopN";
            topN.Value = TenantBreakdownTopN;
            command.Parameters.Add(topN);

            await using DbDataReader reader = await command.ExecuteReaderAsync(ct).ConfigureAwait(false);

            while (await reader.ReadAsync(ct).ConfigureAwait(false))
            {
                string tenantKey = reader.GetString(0);
                long tenantOrphans =
                    reader.GetInt64(1);

                parts.Add($"{tenantKey}={tenantOrphans}");
            }
        }

        if (parts.Count == 0)
            return;

        _logger.LogWarning(
            "Data consistency orphan tenant rollup (detection exceeds threshold={Threshold}; table={Table}; column={Column}): top tenants by orphan count — {TenantRollup}",
            threshold,
            table,
            column,
            string.Join(", ", parts));
    }

    private static void TryRecordAlert(long count, int threshold, string table, string column)
    {
        if (!DataConsistencyEnforcementPolicy.IsAlertEligible(count, threshold))
            return;

        ArchLucidInstrumentation.DataConsistencyAlerts.Add(
            1,
            new KeyValuePair<string, object?>("table", table),
            new KeyValuePair<string, object?>("column", column));
    }

    private async Task LogRemediationDryRunSamplesAsync(
        DbConnection connection,
        int maxRows,
        long goldenCount,
        long findingsCount,
        CancellationToken ct)
    {
        if (goldenCount > 0)
        {
            IReadOnlyList<string> ids = await ReadTopOrphanGoldenManifestIdsAsync(connection, maxRows, ct).ConfigureAwait(false);

            if (ids.Count > 0)

                _logger.LogInformation(
                    "Data consistency orphan remediation dry-run (probe, no delete): GoldenManifests sample (top {MaxRows}): {Ids}",
                    maxRows,
                    string.Join(", ", ids));
        }

        if (findingsCount > 0)
        {
            IReadOnlyList<string> ids = await ReadTopOrphanFindingsSnapshotIdsAsync(connection, maxRows, ct).ConfigureAwait(false);

            if (ids.Count > 0)

                _logger.LogInformation(
                    "Data consistency orphan remediation dry-run (probe, no delete): FindingsSnapshots sample (top {MaxRows}): {Ids}",
                    maxRows,
                    string.Join(", ", ids));
        }
    }

    private async Task AutoRemediateOrphanGraphSnapshotsAsync(
        DbConnection connection,
        int maxRows,
        CancellationToken ct)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = DataConsistencyOrphanRemediationSql.SoftDeleteOrphanGraphSnapshotsWithOutput;
        DbParameter maxRowsParameter = command.CreateParameter();
        maxRowsParameter.ParameterName = "@MaxRows";
        maxRowsParameter.Value = maxRows;
        command.Parameters.Add(maxRowsParameter);

        List<string> ids = [];
        await using DbDataReader reader = await command.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            ids.Add(reader.GetGuid(0).ToString("D", CultureInfo.InvariantCulture));
        }

        if (ids.Count > 0)
        {
            _logger.LogInformation(
                "Data consistency auto-remediation (soft delete): GraphSnapshots ({Count}): {Ids}",
                ids.Count,
                string.Join(", ", ids));

            using IServiceScope scope = _scopeFactory.CreateScope();
            IAuditService auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = "GraphSnapshotOrphansRemediated",
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            dryRun = false,
                            deletedCount = ids.Count,
                            graphSnapshotIds = ids
                        })
                },
                ct);
        }
    }

    private static async Task<IReadOnlyList<string>> ReadTopOrphanGoldenManifestIdsAsync(
        DbConnection connection,
        int maxRows,
        CancellationToken ct)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = DataConsistencyOrphanRemediationSql.SelectOrphanGoldenManifestIds;
        DbParameter maxRowsParameter = command.CreateParameter();
        maxRowsParameter.ParameterName = "@MaxRows";
        maxRowsParameter.Value = maxRows;
        command.Parameters.Add(maxRowsParameter);

        List<string> ids = [];

        await using DbDataReader reader = await command.ExecuteReaderAsync(ct).ConfigureAwait(false);

        while (await reader.ReadAsync(ct).ConfigureAwait(false))

            ids.Add(reader.GetGuid(0).ToString("D", CultureInfo.InvariantCulture));

        return ids;
    }

    private static async Task<IReadOnlyList<string>> ReadTopOrphanFindingsSnapshotIdsAsync(
        DbConnection connection,
        int maxRows,
        CancellationToken ct)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = DataConsistencyOrphanRemediationSql.SelectOrphanFindingsSnapshotIds;
        DbParameter maxRowsParameter = command.CreateParameter();
        maxRowsParameter.ParameterName = "@MaxRows";
        maxRowsParameter.Value = maxRows;
        command.Parameters.Add(maxRowsParameter);

        List<string> ids = [];

        await using DbDataReader reader = await command.ExecuteReaderAsync(ct).ConfigureAwait(false);

        while (await reader.ReadAsync(ct).ConfigureAwait(false))

            ids.Add(reader.GetGuid(0).ToString("D", CultureInfo.InvariantCulture));

        return ids;
    }
}
