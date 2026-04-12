using System.Data.Common;

using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Health;

/// <summary>
/// Compares recent row counts in <c>dbo.ArchitectureRuns</c> vs <c>dbo.Runs</c> to surface dual-write drift (ADR-0002).
/// Diagnostic only — not part of readiness probes.
/// </summary>
public sealed class DualPersistenceConsistencyHealthCheck(
    IDbConnectionFactory connectionFactory,
    IOptions<DualPersistenceConsistencyHealthCheckOptions> options) : IHealthCheck
{
    private const string SqlArchitectureRunsCount = """
        SELECT COUNT_BIG(*) FROM dbo.ArchitectureRuns
        WHERE CreatedUtc >= @SinceUtc;
        """;

    private const string SqlRunsCount = """
        SELECT COUNT_BIG(*) FROM dbo.Runs
        WHERE CreatedUtc >= @SinceUtc;
        """;

    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly IOptions<DualPersistenceConsistencyHealthCheckOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    /// <summary>Builds the health result from precomputed counts (unit-tested without SQL).</summary>
    internal static HealthCheckResult EvaluateCounts(
        long architectureRunCount,
        long runCount,
        DualPersistenceConsistencyHealthCheckOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        int maxDelta = Math.Max(0, options.MaxAllowedDelta);
        long delta = Math.Abs(architectureRunCount - runCount);

        Dictionary<string, object> data = new()
        {
            ["architectureRunCount"] = architectureRunCount,
            ["runCount"] = runCount,
            ["delta"] = delta,
            ["maxAllowedDelta"] = maxDelta,
            ["recentWindowHours"] = Math.Max(1, options.RecentWindowHours),
        };

        if (delta <= maxDelta)
        {
            return HealthCheckResult.Healthy(
                $"Dual persistence counts aligned within threshold (delta {delta} <= {maxDelta}).",
                data);
        }

        return HealthCheckResult.Degraded(
            $"ArchitectureRuns vs Runs count delta {delta} exceeds threshold {maxDelta} (recent window {Math.Max(1, options.RecentWindowHours)}h).",
            data: data);
    }

    /// <inheritdoc />
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        DualPersistenceConsistencyHealthCheckOptions opts = _options.Value;
        int windowHours = Math.Max(1, opts.RecentWindowHours);
        DateTime sinceUtc = DateTime.UtcNow.AddHours(-windowHours);

        DbConnection connection = (DbConnection)_connectionFactory.CreateConnection();

        await using (connection)
        {
            try
            {
                await connection.OpenAsync(cancellationToken);

                long architectureCount = await connection.QuerySingleAsync<long>(
                    new CommandDefinition(
                        SqlArchitectureRunsCount,
                        new { SinceUtc = sinceUtc },
                        cancellationToken: cancellationToken));

                long runsCount = await connection.QuerySingleAsync<long>(
                    new CommandDefinition(
                        SqlRunsCount,
                        new { SinceUtc = sinceUtc },
                        cancellationToken: cancellationToken));

                return EvaluateCounts(architectureCount, runsCount, opts);
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy(
                    "Dual persistence consistency query failed.",
                    ex,
                    new Dictionary<string, object>
                    {
                        ["recentWindowHours"] = windowHours,
                    });
            }
        }
    }
}
