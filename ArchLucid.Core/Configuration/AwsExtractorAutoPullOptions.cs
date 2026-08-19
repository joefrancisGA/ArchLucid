namespace ArchLucid.Core.Configuration;

/// <summary>
///     Tier-2 AWS extractor continuous pull worker (leader-elected; per-connection session lock).
/// </summary>
public sealed class AwsExtractorAutoPullOptions
{
    public const string SectionName = "CloudPolling:Aws";

    /// <summary>Master switch for the worker loop (default off).</summary>
    public bool Enabled { get; set; }

    /// <summary>Polling interval when <see cref="Enabled"/> is true (hours; clamped in hosted service).</summary>
    public int IntervalHours { get; set; } = 24;

    /// <summary>Pause between connection pulls within one pass (seconds; clamped in orchestrator).</summary>
    public int ConnectionCooldownSeconds { get; set; } = 2;
}
