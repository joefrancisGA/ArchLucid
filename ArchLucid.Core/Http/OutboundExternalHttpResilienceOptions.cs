namespace ArchLucid.Core.Http;

/// <summary>
///     Tuning for outbound webhook / ITSM / integration <see cref="System.Net.Http.HttpClient" /> Polly pipelines
///     (retry + ratio-based circuit breaker).
/// </summary>
public sealed class OutboundExternalHttpResilienceOptions
{
    public const string SectionName = "ArchLucid:OutboundHttp:Resilience";

    /// <summary>When false, only retry is applied (circuit breaker disabled — useful for isolated tests).</summary>
    public bool CircuitBreakerEnabled { get; set; } = true;

    /// <summary>Share of failed outcomes in the sampling window that opens the breaker (0.1–1.0).</summary>
    public double FailureRatio { get; set; } = 0.5;

    /// <summary>Sliding window length for failure-ratio sampling.</summary>
    public int SamplingDurationSeconds { get; set; } = 30;

    /// <summary>Minimum calls in the window before the breaker can trip on ratio alone.</summary>
    public int MinimumThroughput { get; set; } = 8;

    /// <summary>Duration the breaker stays open before probing half-open.</summary>
    public int BreakDurationSeconds { get; set; } = 60;

    /// <summary>Retries after the first attempt (same semantics as webhook production policy).</summary>
    public int MaxRetryAttempts { get; set; } = 3;

    public void Normalize()
    {
        if (FailureRatio < 0.1)
            FailureRatio = 0.1;

        if (FailureRatio > 1.0)
            FailureRatio = 1.0;

        if (SamplingDurationSeconds < 5)
            SamplingDurationSeconds = 5;

        if (MinimumThroughput < 2)
            MinimumThroughput = 2;

        if (BreakDurationSeconds < 5)
            BreakDurationSeconds = 5;

        if (MaxRetryAttempts < 0)
            MaxRetryAttempts = 0;

        if (MaxRetryAttempts > 10)
            MaxRetryAttempts = 10;
    }
}
