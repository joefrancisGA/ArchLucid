using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Application.DataConsistency;

/// <summary>Maps reconciliation findings to readiness, decoupling operational stale-run debt from integrity signals.</summary>
public static class DataConsistencyReadinessEvaluator
{
    /// <summary>Check name emitted by <see cref="DataConsistencyReconciliationService" /> for stale in-flight runs.</summary>
    public const string StaleInFlightRunsCheckName = "stale_in_flight_runs";

    public static HealthCheckResult Evaluate(DataConsistencyReport report, DataConsistencyReconciliationOptions options)
    {
        ArgumentNullException.ThrowIfNull(report);
        ArgumentNullException.ThrowIfNull(options);

        if (report.Findings.Any(static f => f.Severity == DataConsistencyFindingSeverity.Critical))
        {
            return HealthCheckResult.Unhealthy("Critical data consistency findings detected in the last reconciliation.");
        }

        bool hasBlockingWarning = report.Findings.Any(f =>
            f.Severity == DataConsistencyFindingSeverity.Warning && BlocksReadiness(f, options));

        if (hasBlockingWarning)
        {
            return HealthCheckResult.Degraded("Warning-level data consistency findings detected in the last reconciliation.");
        }

        return HealthCheckResult.Healthy("Last data consistency reconciliation reported no blocking warnings or critical issues.");
    }

    internal static bool BlocksReadiness(DataConsistencyFinding finding, DataConsistencyReconciliationOptions options)
    {
        if (finding.Severity != DataConsistencyFindingSeverity.Warning)
            return false;

        if (string.Equals(finding.CheckName, StaleInFlightRunsCheckName, StringComparison.Ordinal))
            return options.StaleInFlightRunsBlockReadiness;

        return true;
    }
}
