namespace ArchLucid.Api.Models;

/// <summary>Body for trial upgrade nudge telemetry endpoints (Improvement #14).</summary>
public sealed class TrialUpgradeNudgeTelemetryRequest
{
    /// <summary>Low-cardinality trigger label: <c>runs</c>, <c>seats</c>, or <c>expiry</c>.</summary>
    public string? Trigger
    {
        get;
        init;
    }
}
