using System.Net;

namespace ArchLucid.Core.Resilience;

/// <summary>Shared transient HTTP status classification for LLM completion and embedding provider calls.</summary>
public static class ProviderHttpFailurePolicy
{
    public static bool IsRetryableStatus(int statusCode) =>
        statusCode is 429 or 500 or 502 or 503 or 504;

    public static bool ShouldRecordEmbeddingFailure(Exception exception)
    {
        ArgumentNullException.ThrowIfNull(exception);

        if (exception is OperationCanceledException cancellation &&
            (cancellation.CancellationToken.IsCancellationRequested || exception is not TaskCanceledException))
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
}
