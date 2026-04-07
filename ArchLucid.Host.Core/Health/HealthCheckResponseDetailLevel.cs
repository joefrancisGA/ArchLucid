namespace ArchLucid.Host.Core.Health;

/// <summary>
/// Controls how much information is returned in JSON health responses (information disclosure vs operator diagnostics).
/// </summary>
public enum HealthCheckResponseDetailLevel
{
    /// <summary>Overall status and per-check name/status only (safe for anonymous readiness probes).</summary>
    Summary,

    /// <summary>Full diagnostics: durations, descriptions, exception messages, build provenance.</summary>
    Detailed,
}
