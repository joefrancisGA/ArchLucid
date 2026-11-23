using System.Net;

namespace ArchLucid.Core.Resilience;

/// <summary>Shared transient HTTP status classification for LLM completion and embedding provider calls.</summary>
public static class ProviderHttpFailurePolicy
{
    public static bool IsRetryableStatus(int statusCode) =>
        statusCode is 429 or 500 or 502 or 503 or 504;

    /// <summary>Cancellation signaled by the caller or an explicit operation cancellation is not a provider fault.</summary>
    public static bool IsCallerCancellation(Exception exception)
    {
        ArgumentNullException.ThrowIfNull(exception);

        return exception is OperationCanceledException cancellation &&
               (cancellation.CancellationToken.IsCancellationRequested || exception is not TaskCanceledException);
    }

    /// <summary>Shared retryable provider-failure predicate for completion and embedding circuit breakers.</summary>
    public static bool ShouldRecordProviderFailure(Exception exception)
    {
        ArgumentNullException.ThrowIfNull(exception);

        if (IsCallerCancellation(exception))
            return false;

        if (exception is CircuitBreakerOpenException or InvalidOperationException or
            System.Text.Json.JsonException or ArgumentException)
            return false;

        if (exception is HttpRequestException http)
            return http.StatusCode is not { } status || IsRetryableStatus((int)status);

        if (exception is System.ClientModel.ClientResultException client)
            return IsRetryableStatus(client.Status);

        return true;
    }

    /// <summary>Compatibility alias for embedding callers; use the shared provider predicate for new code.</summary>
    public static bool ShouldRecordEmbeddingFailure(Exception exception) =>
        ShouldRecordProviderFailure(exception);
}
