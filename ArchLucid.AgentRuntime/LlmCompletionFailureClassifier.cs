using System.ClientModel;
using System.Text.Json;

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

        if (ex is OperationCanceledException { CancellationToken.IsCancellationRequested: true })
        {
            return LlmCompletionFailureKind.Cancel;
        }

        if (ex is CircuitBreakerOpenException)
        {
            return LlmCompletionFailureKind.SemanticTerminal;
        }

        if (ex is InvalidOperationException or JsonException or ArgumentException)
        {
            return LlmCompletionFailureKind.SemanticTerminal;
        }

        if (ex is HttpRequestException httpRequestException)
        {
            if (httpRequestException.StatusCode is not { } statusCode)
            {
                return LlmCompletionFailureKind.TransportRetryable;
            }

            return IsRetryableHttpStatus((int)statusCode)
                ? LlmCompletionFailureKind.TransportRetryable
                : LlmCompletionFailureKind.SemanticTerminal;
        }

        if (ex is ClientResultException clientResultException)
        {
            return IsRetryableHttpStatus(clientResultException.Status)
                ? LlmCompletionFailureKind.TransportRetryable
                : LlmCompletionFailureKind.SemanticTerminal;
        }

        if (ex is TaskCanceledException { CancellationToken.IsCancellationRequested: false })
        {
            return LlmCompletionFailureKind.TransportRetryable;
        }

        if (ex is IOException)
        {
            return LlmCompletionFailureKind.TransportRetryable;
        }

        return LlmCompletionFailureKind.TransportRetryable;
    }

    /// <summary>Whether Polly should retry the call.</summary>
    public static bool ShouldRetry(Exception ex) => Classify(ex) == LlmCompletionFailureKind.TransportRetryable;

    /// <summary>Whether a failed call should advance the circuit breaker failure counter.</summary>
    public static bool ShouldRecordCircuitBreakerFailure(Exception ex) =>
        Classify(ex) == LlmCompletionFailureKind.TransportRetryable;

    private static bool IsRetryableHttpStatus(int statusCode) =>
        statusCode is 429 or 500 or 502 or 503 or 504;
}
