namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Self-service growth funnel telemetry: trial signup, email OTP, abuse denials, activation latency, conversion,
///     expiry, and upgrade/expansion nudges.
/// </summary>
/// <remarks>
///     Label values are normalized to closed sets here rather than at the call site so a new caller cannot silently
///     explode metric cardinality (every unrecognized value collapses to <c>unknown</c>).
/// </remarks>
public static partial class ArchLucidGrowthFunnelMeters;
