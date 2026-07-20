namespace ArchLucid.Core.Configuration;

/// <summary>Server-side cost and abuse controls for anonymous Quick Scan demonstrations.</summary>
public sealed class QuickScanOptions
{
    public const string SectionPath = "ArchLucid:QuickScan";

    /// <summary>Master kill switch — when false, only sample results are served.</summary>
    public bool Enabled { get; set; }

    /// <summary>Maximum estimated USD spend for a single scan.</summary>
    public decimal MaxEstimatedCostUsdPerScan { get; set; } = 0.05m;

    /// <summary>Maximum input tokens charged to a single scan.</summary>
    public int MaxInputTokensPerScan { get; set; } = 4_000;

    /// <summary>Maximum output tokens charged to a single scan.</summary>
    public int MaxOutputTokensPerScan { get; set; } = 1_200;

    /// <summary>Maximum LLM completion calls per scan (no retry loops).</summary>
    public int MaxModelCallsPerScan { get; set; } = 1;

    /// <summary>Maximum retry attempts after a failed model call.</summary>
    public int MaxRetryCount { get; set; }

    /// <summary>Hard processing timeout in seconds.</summary>
    public int MaxProcessingDurationSeconds { get; set; } = 45;

    /// <summary>Maximum concurrent anonymous scans cluster-wide.</summary>
    public int MaxConcurrentScans { get; set; } = 8;

    /// <summary>Maximum scans per browser session identifier per UTC day.</summary>
    public int MaxScansPerSessionPerDay { get; set; } = 3;

    /// <summary>Maximum scans per client IP per UTC hour.</summary>
    public int MaxScansPerIpPerHour { get; set; } = 6;

    /// <summary>Maximum scans per client IP per UTC day.</summary>
    public int MaxScansPerIpPerDay { get; set; } = 12;

    /// <summary>Global Quick Scan requests per UTC hour.</summary>
    public int GlobalMaxRequestsPerHour { get; set; } = 120;

    /// <summary>Global Quick Scan requests per UTC day.</summary>
    public int GlobalMaxRequestsPerDay { get; set; } = 500;

    /// <summary>Mandatory global AI spend ceiling per UTC hour (USD).</summary>
    public decimal GlobalMaxSpendUsdPerHour { get; set; } = 5m;

    /// <summary>Mandatory global AI spend ceiling per UTC day (USD).</summary>
    public decimal GlobalMaxSpendUsdPerDay { get; set; } = 25m;

    /// <summary>After this many successful scans in a session, require sign-in for more.</summary>
    public int SignInRequiredAfterSessionScans { get; set; } = 2;

    /// <summary>Maximum findings returned to clients.</summary>
    public int MaxFindingsReturned { get; set; } = 5;

    /// <summary>Maximum characters accepted for <c>systemName</c>.</summary>
    public int MaxSystemNameLength { get; set; } = 100;

    /// <summary>Maximum characters accepted for <c>description</c>.</summary>
    public int MaxDescriptionLength { get; set; } = 1_500;

    /// <summary>Maximum optional architecture concerns.</summary>
    public int MaxArchitectureConcerns { get; set; } = 3;
}
