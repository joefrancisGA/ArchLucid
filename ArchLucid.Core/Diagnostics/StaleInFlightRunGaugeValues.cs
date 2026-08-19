namespace ArchLucid.Core.Diagnostics;

/// <summary>Cached fleet-wide stale in-flight run gauges (updated by a background collector).</summary>
/// <remarks>
/// Cardinality-safe: no <c>tenant_id</c> labels. Tenant/run triage ids belong in structured logs only (TB-958).
/// </remarks>
public readonly record struct StaleInFlightRunGaugeValues(
    long StaleInFlightCount,
    double OldestStaleAgeSeconds);
