using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.DataConsistency;

/// <summary>Maps the last scheduled reconciliation outcome to ASP.NET health status.</summary>
public sealed class DataConsistencyHealthCheck(
    DataConsistencyReconciliationHealthState healthState,
    IOptionsMonitor<DataConsistencyReconciliationOptions> optionsMonitor) : IHealthCheck
{
    private readonly DataConsistencyReconciliationHealthState _healthState = healthState ?? throw new ArgumentNullException(nameof(healthState));

    private readonly IOptionsMonitor<DataConsistencyReconciliationOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);
        _healthState.TrySnapshot(out bool hasRun, out DataConsistencyReport? report, out string? error);
        if (!hasRun)
            return Task.FromResult(HealthCheckResult.Unhealthy("Data consistency reconciliation has not run yet."));
        if (error is not null)
            return Task.FromResult(HealthCheckResult.Unhealthy("Data consistency reconciliation failed: " + error));
        if (report is null)
            return Task.FromResult(HealthCheckResult.Unhealthy("Data consistency reconciliation state is inconsistent (no report)."));

        return Task.FromResult(DataConsistencyReadinessEvaluator.Evaluate(report, _optionsMonitor.CurrentValue));
    }
}
