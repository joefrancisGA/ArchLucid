using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

public static partial class ArchLucidInstrumentation
{
    private static int _circuitBreakerStateObservableGaugeRegistered;

    private static int _llmTenantBudgetUtilizationObservableGaugeRegistered;

    private static int _llmTenantBudgetRemainingObservableGaugeRegistered;

    private static int _SponsorRoiSavingsObservableGaugeRegistered;

    private static long _warmCatalogsAvailableCached;

    private static int _warmCatalogsAvailableObservableGaugeRegistered;

    private static Func<IReadOnlyList<(string GateName, string State)>>? _circuitBreakerSnapshotReader;

    private static Func<Measurement<double>[]>? _llmBudgetUtilizationReader;

    private static Func<Measurement<double>[]>? _llmBudgetRemainingReader;

    private static Func<Measurement<double>[]>? _SponsorRoiSavingsReader;

    public static void SetCircuitBreakerSnapshotReader(Func<IReadOnlyList<(string GateName, string State)>> reader) =>
        Volatile.Write(ref _circuitBreakerSnapshotReader, reader);

    public static void SetLlmBudgetUtilizationReader(Func<Measurement<double>[]> reader) =>
        Volatile.Write(ref _llmBudgetUtilizationReader, reader);

    public static void SetLlmBudgetRemainingReader(Func<Measurement<double>[]> reader) =>
        Volatile.Write(ref _llmBudgetRemainingReader, reader);

    public static void SetSponsorRoiSavingsReader(Func<Measurement<double>[]> reader) =>
        Volatile.Write(ref _SponsorRoiSavingsReader, reader);

    /// <summary>
    ///     Registers per-gauge circuit breaker state once (numeric: Closed=0, HalfOpen=1, Open=2; labels <c>gate</c>,
    ///     <c>state</c>).
    /// </summary>
    public static void EnsureCircuitBreakerStateObservableGaugesRegistered()
    {
        if (Interlocked.Exchange(ref _circuitBreakerStateObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_circuit_breaker_state",
            static () =>
            {
                IReadOnlyList<(string GateName, string State)> snaps = _circuitBreakerSnapshotReader?.Invoke() ?? Array.Empty<(string, string)>();
                Measurement<int>[] measurements = new Measurement<int>[snaps.Count];

                for (int i = 0; i < snaps.Count; i++)
                {
                    (string gateName, string state) = snaps[i];
                    int n = state switch
                    {
                        "Open" => 2,
                        "HalfOpen" => 1,
                        _ => 0
                    };
                    measurements[i] = new Measurement<int>(
                        n,
                        new KeyValuePair<string, object?>("gate", gateName),
                        new KeyValuePair<string, object?>("state", state));
                }

                return measurements;
            },
            description:
            "Circuit breaker state per gate (0=Closed,1=HalfOpen,2=Open) with string state tag (OpenAI gates).");
    }

    /// <summary>Registers observable per-tenant UTC-month LLM budget utilization fractions (collector updates snapshots on a ≥5 min cadence).</summary>
    public static void EnsureLlmTenantBudgetUtilizationObservableGaugeRegistered()
    {
        if (Interlocked.Exchange(ref _llmTenantBudgetUtilizationObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_llm_budget_utilization_fraction",
            () => _llmBudgetUtilizationReader?.Invoke() ?? Array.Empty<Measurement<double>>(),
            description:
            "UTC-month LLM dollar utilization (CommittedUsd+ReservedUsd over configured hard cutoff + purchased bump; label tenant_id).");
    }

    /// <summary>Registers observable per-tenant UTC-month LLM budget USD remaining under the effective hard cap (collector updates alongside utilization).</summary>
    public static void EnsureLlmTenantBudgetRemainingUsdObservableGaugeRegistered()
    {
        if (Interlocked.Exchange(ref _llmTenantBudgetRemainingObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_llm_budget_remaining_usd",
            () => _llmBudgetRemainingReader?.Invoke() ?? Array.Empty<Measurement<double>>(),
            "USD",
            "UTC-month LLM dollar headroom remaining under hard cutoff + purchased bump (non-negative; label tenant_id).");
    }

    /// <summary>Registers observable sponsor ROI savings gauge (platform aggregate + optional per-tenant rows).</summary>
    public static void EnsureSponsorRoiSavingsObservableGaugeRegistered()
    {
        if (Interlocked.Exchange(ref _SponsorRoiSavingsObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_tenant_estimated_savings_usd",
            () => _SponsorRoiSavingsReader?.Invoke() ?? Array.Empty<Measurement<double>>(),
            "USD",
            "Estimated USD savings rollup from Sponsor ROI dedup rules. Labels: scope=platform|tenant; tenant_id when scope=tenant.");
    }

    /// <summary>Registers warm tenant catalog pool depth gauge once (leader-elected replenish worker publishes counts).</summary>
    public static void EnsureWarmCatalogsAvailableObservableGaugeRegistered()
    {
        if (Interlocked.Exchange(ref _warmCatalogsAvailableObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid.tenancy.warm_catalogs_available",
            () => new Measurement<long>(Volatile.Read(ref _warmCatalogsAvailableCached)),
            description:
            "Unclaimed warm tenant SQL catalogs ready for trial signup (SystemWithPerTenantCatalogs topology only).");
    }

    /// <summary>Updates the cached value read by <c>archlucid.tenancy.warm_catalogs_available</c>.</summary>
    public static void PublishWarmCatalogsAvailable(long count)
    {
        if (count < 0)

            count = 0;

        Volatile.Write(ref _warmCatalogsAvailableCached, count);
    }
}
