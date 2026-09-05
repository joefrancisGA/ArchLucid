using System.ClientModel;

using ArchLucid.Core.Resilience;

using Azure;

namespace ArchLucid.AgentRuntime;

/// <summary>Fallback eligibility rules for transient LLM completion failures, including provider outages.</summary>
internal static class AgentCompletionFallbackEligibility
{
    /// <summary>
    ///     True when <paramref name="ex" /> is a same-family failover candidate: 429/5xx, network failure,
    ///     HTTP timeout, or an open primary circuit breaker. User cancellation is excluded by callers.
    /// </summary>
    internal static bool IsFallbackEligible(Exception ex)
    {
        ArgumentNullException.ThrowIfNull(ex);

        if (ex is CircuitBreakerOpenException)
            return true;

        if (ex is OperationCanceledException)
            return true;

        if (ex is HttpRequestException http)
            return IsFallbackTrigger(http);

        if (ex is ClientResultException cre)
            return IsClientResultFallbackTrigger(cre);

        if (ex is RequestFailedException rfe)
            return IsRequestFailedFallbackTrigger(rfe);

        return false;
    }

    private static bool IsFallbackTrigger(HttpRequestException ex)
    {
        if (ex.StatusCode is not { } statusCode)
            return true;

        int code = (int)statusCode;

        return code is 429 or >= 500 and < 600;
    }

    /// <summary>Azure OpenAI SDK path: <see cref="ClientResultException" /> carries the HTTP status.</summary>
    private static bool IsClientResultFallbackTrigger(ClientResultException ex)
    {
        return IsFallbackEligibleStatus(ex.Status);
    }

    /// <summary>Azure.Core path: <see cref="RequestFailedException" /> (e.g. 429 / 503 from HTTP pipeline).</summary>
    private static bool IsRequestFailedFallbackTrigger(RequestFailedException ex)
    {
        return IsFallbackEligibleStatus(ex.Status);
    }

    private static bool IsFallbackEligibleStatus(int statusCode)
    {
        return statusCode is 429 or >= 500 and < 600;
    }
}
