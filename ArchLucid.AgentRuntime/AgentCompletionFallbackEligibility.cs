using System.ClientModel;

using Azure;

namespace ArchLucid.AgentRuntime;

/// <summary>Fallback eligibility rules for transient LLM completion failures.</summary>
internal static class AgentCompletionFallbackEligibility
{
    /// <summary>True when <paramref name="ex" /> carries status 429 or a 5xx server error.</summary>
    internal static bool IsFallbackEligible(Exception ex)
    {
        if (ex is HttpRequestException http)
        {
            return IsFallbackTrigger(http);
        }

        if (ex is ClientResultException cre)
        {
            return IsClientResultFallbackTrigger(cre);
        }

        if (ex is RequestFailedException rfe)
        {
            return IsRequestFailedFallbackTrigger(rfe);
        }

        return false;
    }

    private static bool IsFallbackTrigger(HttpRequestException ex)
    {
        if (ex.StatusCode is not { } statusCode)
        {
            return false;
        }

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
