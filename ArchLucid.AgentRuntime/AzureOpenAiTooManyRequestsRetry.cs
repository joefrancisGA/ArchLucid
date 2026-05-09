using System.ClientModel;
using System.ClientModel.Primitives;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>429 / Too Many Requests handling for Azure OpenAI chat completions (Retry-After + bounded fallback).</summary>
internal static class AzureOpenAiTooManyRequestsRetry
{
    /// <summary>Maximum CompleteChat attempts per user-visible call when every attempt returns HTTP 429.</summary>
    internal const int MaxConsecutiveTooManyRequestsAttempts = 4;

    internal static TimeSpan MaxRetryAfterDelay
    {
        get;
    } = TimeSpan.FromMinutes(2);

    internal static TimeSpan MinimumThrottleDelay
    {
        get;
    } = TimeSpan.FromMilliseconds(50);

    /// <summary>Computes wait duration after a 429: prefers Retry-After, else exponential fallback.</summary>
    internal static TimeSpan GetDelayBeforeRetry(
        ClientResultException ex,
        int zeroBased429RetryIndex,
        ILogger? logger,
        out bool usedRetryAfterHeader)
    {
        if (TryGetRetryAfterDelay(ex, out TimeSpan fromHeader))
        {
            usedRetryAfterHeader = true;
            fromHeader = CapDelay(fromHeader);

            if (fromHeader < MinimumThrottleDelay)
                fromHeader = MinimumThrottleDelay;

            return fromHeader;
        }

        usedRetryAfterHeader = false;

        int expSeconds = 1 << Math.Min(zeroBased429RetryIndex, 5);
        TimeSpan fallback = TimeSpan.FromSeconds(Math.Min(expSeconds, 30));

        if (logger is not null && logger.IsEnabled(LogLevel.Debug))
            logger.LogDebug(
                "Azure OpenAI returned HTTP 429 without a usable Retry-After header; using fallback delay {Delay}.",
                fallback);

        return fallback;
    }

    internal static bool TryGetRetryAfterDelay(ClientResultException ex, out TimeSpan delay)
    {
        delay = default;

        if (ex.Status != 429)
            return false;

        PipelineResponse? raw = ex.GetRawResponse();

        if (raw is null)
            return false;

        if (!TryGetRetryAfterHeaderRaw(raw.Headers, out string? rawValue) || string.IsNullOrWhiteSpace(rawValue))
            return false;

        return TryParseRetryAfterHeaderValue(rawValue, out delay);
    }

    internal static bool TryParseRetryAfterHeaderValue(string? raw, out TimeSpan delay)
    {
        delay = default;

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        raw = raw.Trim();

        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int seconds) && seconds >= 0)
        {
            delay = TimeSpan.FromSeconds(seconds);

            return true;
        }

        if (DateTimeOffset.TryParse(
                raw,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out DateTimeOffset retryAt))
        {
            delay = retryAt - DateTimeOffset.UtcNow;

            return delay > TimeSpan.Zero;
        }

        return false;
    }

    internal static TimeSpan CapDelay(TimeSpan delay)
    {
        if (delay > MaxRetryAfterDelay)
            return MaxRetryAfterDelay;

        return delay;
    }

    private static bool TryGetRetryAfterHeaderRaw(PipelineResponseHeaders headers, [NotNullWhen(true)] out string? value)
    {
        value = null;

        if (headers.TryGetValue("Retry-After", out string? v) && !string.IsNullOrWhiteSpace(v))
        {
            value = v;

            return true;
        }

        return false;
    }
}
