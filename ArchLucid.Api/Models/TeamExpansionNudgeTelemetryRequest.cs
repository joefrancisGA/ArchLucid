namespace ArchLucid.Api.Models;

/// <summary>Body for team expansion nudge telemetry endpoints (Improvement #5).</summary>
public sealed class TeamExpansionNudgeTelemetryRequest
{
    /// <summary>Low-cardinality trigger label: <c>seats</c> or <c>workspaces</c>.</summary>
    public string? Trigger
    {
        get;
        init;
    }
}
