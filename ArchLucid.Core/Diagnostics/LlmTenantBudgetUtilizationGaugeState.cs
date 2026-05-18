using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>Latest per-tenant LLM UTC-month budget utilization (read on Prometheus scrape).</summary>
public sealed class LlmTenantBudgetUtilizationGaugeState
{
    private readonly Lock _gate = new();

    private Measurement<double>[] _measurements = [];

    public Measurement<double>[] SnapshotMeasurements()
    {
        lock (_gate)
            return _measurements;
    }

    /// <param name="measurements">Replacements for prior series set (typically built every ≥5 minutes).</param>
    public void PublishMeasurements(Measurement<double>[] measurements)
    {
        Measurement<double>[] next = measurements ?? [];

        lock (_gate)
            _measurements = next;
    }
}
