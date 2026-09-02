using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

public static partial class ArchLucidLlmMeters
{
    /// <summary>Half-open probe results (labels: <c>gate</c>, <c>outcome</c>=success|failure|cancelled).</summary>
    public static readonly Counter<long> CircuitBreakerProbeOutcomes =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_circuit_breaker_probe_outcomes_total",
            description: "Half-open probe results (labels: gate, outcome=success|failure|canceled).");

    /// <summary>Calls rejected while open or while a half-open probe is in flight (label: <c>gate</c>).</summary>
    public static readonly Counter<long> CircuitBreakerRejections =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_circuit_breaker_rejections_total",
            description: "Calls rejected because the circuit was open or a probe was in flight (label: gate).");

    /// <summary>Circuit breaker state changes (labels: <c>gate</c>, <c>from_state</c>, <c>to_state</c>).</summary>
    public static readonly Counter<long> CircuitBreakerStateTransitions =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_circuit_breaker_state_transitions_total",
            description: "Circuit breaker state transitions (labels: gate, from_state, to_state).");
}
