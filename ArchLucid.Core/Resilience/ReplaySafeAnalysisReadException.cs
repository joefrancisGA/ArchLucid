namespace ArchLucid.Core.Resilience;

/// <summary>Signals a transient failure from a replay-safe read whose command does not already retry.</summary>
public sealed class ReplaySafeAnalysisReadException(Exception cause, TimeSpan? retryAfter = null)
    : InvalidOperationException("An eligible analysis read failed transiently.", cause)
{
    public TimeSpan? RetryAfter { get; } = retryAfter;
}
