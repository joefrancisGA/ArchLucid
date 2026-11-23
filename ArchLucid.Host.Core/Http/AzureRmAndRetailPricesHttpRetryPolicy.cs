using System.Net;

using Microsoft.Extensions.Logging;

using Polly;
using Polly.Retry;
using CanonicalAzureHttpRetryPolicy = ArchLucid.Core.Http.AzureRmAndRetailPricesHttpRetryPolicy;

namespace ArchLucid.Host.Core.Http;

/// <summary>
///     Polly v8 outbound retry bridging to <see cref="IAsyncPolicy{TResult}" /> for
///     <see cref="Microsoft.Extensions.Http.Polly.PolicyHttpMessageExtensions.AddPolicyHandler" /> on Azure ARM and Retail Prices APIs.
/// </summary>
/// <remarks>
///     Acceptance: transient <see cref="System.Net.HttpStatusCode.ServiceUnavailable" /> (among other transient HTTP outcomes) retries with
///     exponential backoff. <see cref="MaxRetryAttempts" /> matches <see cref="ArchLucid.Host.Core.Services.Delivery.WebhookOutboundHttpRetryPolicy.ProductionRetryAttempts" />.
/// </remarks>
public static class AzureRmAndRetailPricesHttpRetryPolicy
{
    /// <summary>Retries after the first attempt (four total executions when transient failures occupy the first three responses).</summary>
    public const int MaxRetryAttempts = CanonicalAzureHttpRetryPolicy.MaxRetryAttempts;

    /// <summary>Uses exponential backoff (~2<sup>n</sup> seconds) between attempts.</summary>
    public static IAsyncPolicy<HttpResponseMessage> Create(ILogger logger)
    {
        ArgumentNullException.ThrowIfNull(logger);
        return CanonicalAzureHttpRetryPolicy.Create(logger, args => TryLogRetry(logger, args));
    }

    /// <summary>
    ///     Use the Core retry pipeline and classification with injectable delay.
    ///     The Host.Core adapter retains its enhanced HTTP 429 / Retry-After telemetry.
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> Create(
        ILogger logger,
        Func<int, TimeSpan> sleepDurationProvider)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(sleepDurationProvider);
        return CanonicalAzureHttpRetryPolicy.Create(
            logger, sleepDurationProvider, args => TryLogRetry(logger, args));
    }

    internal static bool ShouldRetryHttpResponse(HttpResponseMessage response) =>
        CanonicalAzureHttpRetryPolicy.ShouldRetryHttpResponse(response);

    internal static void TryLogRetry(ILogger logger, OnRetryArguments<HttpResponseMessage> args)
    {
        if (!logger.IsEnabled(LogLevel.Warning))

            return;

        HttpResponseMessage? result = args.Outcome.Result;

        if (result is not null)
        {
            if (result.StatusCode == HttpStatusCode.TooManyRequests)
            {
                logger.LogWarning(
                    "Azure ARM / Retail Prices HTTP outbound hit rate limit (HTTP 429); Retry-After={RetryAfter}; scheduling retry attempt {RetryAttempt} of {MaxRetries} (delay {RetryDelay}).",
                    TryReadRetryAfterHeader(result) ?? "unspecified",
                    args.AttemptNumber,
                    MaxRetryAttempts,
                    args.RetryDelay);

                return;
            }

            logger.LogWarning(
                "Azure ARM / Retail Prices HTTP outbound scheduling retry after HTTP {HttpStatus}; attempt {RetryAttempt} of {MaxRetries} (delay {RetryDelay}).",
                (int)result.StatusCode,
                args.AttemptNumber,
                MaxRetryAttempts,
                args.RetryDelay);

            return;
        }

        if (args.Outcome.Exception is Exception ex)

            logger.LogWarning(
                ex,
                "Azure ARM / Retail Prices HTTP outbound scheduling retry after transport fault; attempt {RetryAttempt} of {MaxRetries} (delay {RetryDelay}).",
                args.AttemptNumber,
                MaxRetryAttempts,
                args.RetryDelay);
    }

    internal static string? TryReadRetryAfterHeader(HttpResponseMessage response)
    {
        ArgumentNullException.ThrowIfNull(response);

        if (!response.Headers.TryGetValues("Retry-After", out IEnumerable<string>? values))
            return null;

        string? first = values.FirstOrDefault();

        if (string.IsNullOrWhiteSpace(first))
            return null;

        return first.Trim();
    }
}
