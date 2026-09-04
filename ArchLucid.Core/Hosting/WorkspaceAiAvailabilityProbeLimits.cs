namespace ArchLucid.Core.Hosting;

/// <summary>Bounded budgets for workspace AI availability diagnostics (review failure recovery).</summary>
public static class WorkspaceAiAvailabilityProbeLimits
{
    /// <summary>Overall server-side budget for <c>GET /v1/diagnostics/workspace-ai-availability</c>.</summary>
    public static readonly TimeSpan TotalProbeTimeout = TimeSpan.FromSeconds(10);

    /// <summary>Minimal completion output for live vendor probes (platform absorbs cost; not tenant-metered).</summary>
    public const int MaxCompletionTokens = 16;
}
