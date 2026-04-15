using System.Data.Common;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
/// Periodically counts <c>dbo.ComparisonRecords</c> rows whose <c>LeftRunId</c> parses as a GUID but has no matching <c>dbo.Runs</c> row (detection-only).
/// </summary>
public sealed class DataConsistencyOrphanProbeHostedService(
    IOptionsMonitor<DataConsistencyProbeOptions> optionsMonitor,
    IDbConnectionFactory connectionFactory,
    IOptions<ArchLucidOptions> archLucidOptions,
    ILogger<DataConsistencyOrphanProbeHostedService> logger) : BackgroundService
{
    private const string LeftOrphanSql = """
        SELECT COUNT_BIG(1)
        FROM dbo.ComparisonRecords c
        WHERE c.LeftRunId IS NOT NULL
          AND TRY_CONVERT(UNIQUEIDENTIFIER, c.LeftRunId) IS NOT NULL
          AND NOT EXISTS (
              SELECT 1
              FROM dbo.Runs r
              WHERE r.RunId = TRY_CONVERT(UNIQUEIDENTIFIER, c.LeftRunId));
        """;

    private const string RightOrphanSql = """
        SELECT COUNT_BIG(1)
        FROM dbo.ComparisonRecords c
        WHERE c.RightRunId IS NOT NULL
          AND TRY_CONVERT(UNIQUEIDENTIFIER, c.RightRunId) IS NOT NULL
          AND NOT EXISTS (
              SELECT 1
              FROM dbo.Runs r
              WHERE r.RunId = TRY_CONVERT(UNIQUEIDENTIFIER, c.RightRunId));
        """;

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
        DbConnection connection = (DbConnection)connectionFactory.CreateConnection();
        await using DbConnection _ = connection;
        await connection.OpenAsync(ct);

        await LogAndCountOrphansAsync(connection, LeftOrphanSql, "LeftRunId", ct).ConfigureAwait(false);
        await LogAndCountOrphansAsync(connection, RightOrphanSql, "RightRunId", ct).ConfigureAwait(false);
    }

    private async Task LogAndCountOrphansAsync(
        DbConnection connection,
        string sql,
        string columnLabel,
        CancellationToken ct)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = sql;
        object? scalar = await command.ExecuteScalarAsync(ct).ConfigureAwait(false);
        long count = scalar is long l ? l : Convert.ToInt64(scalar ?? 0L, System.Globalization.CultureInfo.InvariantCulture);

        if (count <= 0)
        {
            return;
        }

        logger.LogWarning(
            "Data consistency: {Count} comparison record(s) reference a missing authority RunId ({Column}).",
            count,
            columnLabel);

        ArchLucidInstrumentation.DataConsistencyOrphansDetected.Add(
            count,
            new KeyValuePair<string, object?>("table", "ComparisonRecords"),
            new KeyValuePair<string, object?>("column", columnLabel));
    }
}
