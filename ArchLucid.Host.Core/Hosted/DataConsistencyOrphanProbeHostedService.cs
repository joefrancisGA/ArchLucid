using System.Data.Common;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
/// Periodically counts orphan coordinator rows (comparison left/right run ids, golden manifests, findings snapshots)
/// against <c>dbo.Runs</c>, emits warnings + Prometheus counters (detection-only). Optionally logs admin-equivalent
/// <c>SELECT</c> samples when <see cref="Configuration.DataConsistencyProbeOptions.OrphanProbeRemediationDryRunLogMaxRows"/> is set; never deletes.
/// </summary>
public sealed class DataConsistencyOrphanProbeHostedService(
    IOptionsMonitor<DataConsistencyProbeOptions> optionsMonitor,
    IDbConnectionFactory connectionFactory,
    IOptions<ArchLucidOptions> archLucidOptions,
    ILogger<DataConsistencyOrphanProbeHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(archLucidOptions.Value.StorageProvider))
        {
            return;
        }

        TimeSpan firstDelay = TimeSpan.FromMinutes(2);

        try
        {
            await Task.Delay(firstDelay, stoppingToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            DataConsistencyProbeOptions snapshot = optionsMonitor.CurrentValue;

            if (!snapshot.OrphanProbeEnabled)
            {
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken).ConfigureAwait(false);

                continue;
            }

            int minutes = Math.Clamp(snapshot.OrphanProbeIntervalMinutes, 5, 24 * 60);

            try
            {
                await ProbeOnceAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Data consistency orphan probe failed.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(minutes), stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }

    private async Task ProbeOnceAsync(CancellationToken ct)
    {
        DataConsistencyProbeOptions snapshot = optionsMonitor.CurrentValue;
        int sampleCap = Math.Clamp(snapshot.OrphanProbeRemediationDryRunLogMaxRows, 0, 500);

        DbConnection connection = (DbConnection)connectionFactory.CreateConnection();
        await using DbConnection _ = connection;
        await connection.OpenAsync(ct);

        long leftCount = await LogAndCountOrphansAsync(
                connection,
                DataConsistencyOrphanProbeSql.ComparisonRecordsLeftRunId,
                "ComparisonRecords",
                "LeftRunId",
                ct)
            .ConfigureAwait(false);
        long rightCount = await LogAndCountOrphansAsync(
                connection,
                DataConsistencyOrphanProbeSql.ComparisonRecordsRightRunId,
                "ComparisonRecords",
                "RightRunId",
                ct)
            .ConfigureAwait(false);
        long goldenCount = await LogAndCountOrphansAsync(
                connection,
                DataConsistencyOrphanProbeSql.GoldenManifestsRunId,
                "GoldenManifests",
                "RunId",
                ct)
            .ConfigureAwait(false);
        long findingsCount = await LogAndCountOrphansAsync(
                connection,
                DataConsistencyOrphanProbeSql.FindingsSnapshotsRunId,
                "FindingsSnapshots",
                "RunId",
                ct)
            .ConfigureAwait(false);

        if (sampleCap <= 0)
        {
            return;
        }

        bool anyOrphans = leftCount > 0 || rightCount > 0 || goldenCount > 0 || findingsCount > 0;

        if (!anyOrphans)
        {
            return;
        }

        await LogRemediationDryRunSamplesAsync(connection, sampleCap, leftCount, rightCount, goldenCount, findingsCount, ct)
            .ConfigureAwait(false);
    }

    private async Task LogRemediationDryRunSamplesAsync(
        DbConnection connection,
        int maxRows,
        long leftCount,
        long rightCount,
        long goldenCount,
        long findingsCount,
        CancellationToken ct)
    {
        if (leftCount > 0 || rightCount > 0)
        {
            IReadOnlyList<string> ids = await ReadTopOrphanComparisonRecordIdsAsync(connection, maxRows, ct).ConfigureAwait(false);

            if (ids.Count > 0)
            {
                logger.LogInformation(
                    "Data consistency orphan remediation dry-run (probe, no delete): ComparisonRecords sample (top {MaxRows}): {Ids}",
                    maxRows,
                    string.Join(", ", ids));
            }
        }

        if (goldenCount > 0)
        {
            IReadOnlyList<string> ids = await ReadTopOrphanGoldenManifestIdsAsync(connection, maxRows, ct).ConfigureAwait(false);

            if (ids.Count > 0)
            {
                logger.LogInformation(
                    "Data consistency orphan remediation dry-run (probe, no delete): GoldenManifests sample (top {MaxRows}): {Ids}",
                    maxRows,
                    string.Join(", ", ids));
            }
        }

        if (findingsCount > 0)
        {
            IReadOnlyList<string> ids = await ReadTopOrphanFindingsSnapshotIdsAsync(connection, maxRows, ct).ConfigureAwait(false);

            if (ids.Count > 0)
            {
                logger.LogInformation(
                    "Data consistency orphan remediation dry-run (probe, no delete): FindingsSnapshots sample (top {MaxRows}): {Ids}",
                    maxRows,
                    string.Join(", ", ids));
            }
        }
    }

    private static async Task<IReadOnlyList<string>> ReadTopOrphanComparisonRecordIdsAsync(
        DbConnection connection,
        int maxRows,
        CancellationToken ct)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = DataConsistencyOrphanRemediationSql.SelectOrphanComparisonRecordIds;
        DbParameter maxRowsParameter = command.CreateParameter();
        maxRowsParameter.ParameterName = "@MaxRows";
        maxRowsParameter.Value = maxRows;
        command.Parameters.Add(maxRowsParameter);

        List<string> ids = [];

        await using DbDataReader reader = await command.ExecuteReaderAsync(ct).ConfigureAwait(false);

        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            ids.Add(reader.GetString(0));
        }

        return ids;
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
        {
            ids.Add(reader.GetGuid(0).ToString("D", System.Globalization.CultureInfo.InvariantCulture));
        }

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
        {
            ids.Add(reader.GetGuid(0).ToString("D", System.Globalization.CultureInfo.InvariantCulture));
        }

        return ids;
    }

    private async Task<long> LogAndCountOrphansAsync(
        DbConnection connection,
        string sql,
        string tableMetricLabel,
        string columnLabel,
        CancellationToken ct)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = sql;
        object? scalar = await command.ExecuteScalarAsync(ct).ConfigureAwait(false);
        long count = scalar is long l ? l : Convert.ToInt64(scalar ?? 0L, System.Globalization.CultureInfo.InvariantCulture);

        if (count <= 0)
        {
            return count;
        }

        logger.LogWarning(
            "Data consistency: {Count} row(s) in {Table} reference a missing authority RunId ({Column}).",
            count,
            tableMetricLabel,
            columnLabel);

        ArchLucidInstrumentation.DataConsistencyOrphansDetected.Add(
            count,
            new KeyValuePair<string, object?>("table", tableMetricLabel),
            new KeyValuePair<string, object?>("column", columnLabel));

        return count;
    }
}
