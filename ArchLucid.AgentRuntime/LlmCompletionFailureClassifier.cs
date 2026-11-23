using ArchLucid.Core.Resilience;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Classifies LLM completion failures for Polly retry and circuit-breaker policy (TB-944).
/// </summary>
public enum LlmCompletionFailureKind
{
    /// <summary>User-requested cancellation; do not retry or tick the breaker.</summary>
    Cancel,

    /// <summary>Transient transport/provider fault; retry and tick the breaker on exhaustion.</summary>
    TransportRetryable,

    /// <summary>Semantic-terminal fault (empty payload, schema, content filter, non-retryable 4xx); never retry or tick the breaker.</summary>
    SemanticTerminal,
}

/// <summary>
///     Central classifier for completion/embedding HTTP boundaries (TB-944).
/// </summary>
public static class LlmCompletionFailureClassifier
{
    /// <summary>Maps an exception to retry/breaker policy.</summary>
    public static LlmCompletionFailureKind Classify(Exception ex)
    {
        ArgumentNullException.ThrowIfNull(ex);

        // Core owns provider fault policy so Retrieval and AgentRuntime cannot drift.
        if (ProviderHttpFailurePolicy.IsCallerCancellation(ex))
            return LlmCompletionFailureKind.Cancel;

        return ProviderHttpFailurePolicy.ShouldRecordProviderFailure(ex)
            ? LlmCompletionFailureKind.TransportRetryable
            : LlmCompletionFailureKind.SemanticTerminal;
    }

    /// <summary>Whether Polly should retry the call.</summary>
    public static bool ShouldRetry(Exception ex) => Classify(ex) == LlmCompletionFailureKind.TransportRetryable;

    /// <summary>Whether a failed call should advance the circuit breaker failure counter.</summary>
    public static bool ShouldRecordCircuitBreakerFailure(Exception ex) =>
        Classify(ex) == LlmCompletionFailureKind.TransportRetryable;
}
