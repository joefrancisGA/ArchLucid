namespace ArchLucid.Core.Configuration;

/// <summary>Bounds analysis execution without changing transport-owned retry budgets.</summary>
public sealed class AnalysisStageExecutionOptions
{
    public const string SectionName = "AnalysisExecution";

    public bool EnableDependencyAwareAnalysisReuse { get; set; }

    /// <summary>Compare graph decisions without changing the existing execution or checkpoint protocol.</summary>
    public bool ObserveAnalyticalDependencyGraph { get; set; }

    /// <summary>Use the graph for new versioned durable work. Defaults off.</summary>
    public bool EnableAnalyticalDependencyGraph { get; set; }

    public int SecureNowReuseMaxAgeHours { get; set; } = 24;

    public bool EnableDurableAuthorityRecovery { get; set; }

    public bool EnableDurableSecureNowRecovery { get; set; }

    public int RecoveryMaxAttempts { get; set; } = 3;

    public int DefaultStageTimeoutSeconds { get; set; } = 180;

    public int SecureNowRunTimeoutSeconds { get; set; } = 900;

    public int ReadMaxAttempts { get; set; } = 2;

    public int ReadInitialDelayMilliseconds { get; set; } = 250;

    public Dictionary<string, int> StageTimeoutSeconds { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public TimeSpan GetStageTimeout(string stage) =>
        TimeSpan.FromSeconds(Math.Clamp(
            StageTimeoutSeconds.TryGetValue(stage, out int value) ? value : DefaultStageTimeoutSeconds,
            1,
            86_400));

    public TimeSpan GetSecureNowRunTimeout() => TimeSpan.FromSeconds(Math.Clamp(SecureNowRunTimeoutSeconds, 1, 86_400));
}
