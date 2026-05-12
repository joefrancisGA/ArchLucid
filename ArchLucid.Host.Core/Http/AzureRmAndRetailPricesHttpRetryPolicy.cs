using System.Net;

using Microsoft.Extensions.Logging;

using Polly;
using Polly.Retry;

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
    public const int MaxRetryAttempts = 3;

    /// <summary>Uses exponential backoff (~2<sup>n</sup> seconds) between attempts.</summary>
    public static IAsyncPolicy<HttpResponseMessage> Create(ILogger logger) => Create(logger, ProductionSleepDurationProvider);

    /// <summary>
    ///     Identical transient handling as the single-parameter overload; inject zero-delay backoff for deterministic tests.
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> Create(ILogger logger, Func<int, TimeSpan> sleepDurationProvider)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(sleepDurationProvider);

        ResiliencePipeline<HttpResponseMessage> pipeline = new ResiliencePipelineBuilder<HttpResponseMessage>()
            .AddRetry(new RetryStrategyOptions<HttpResponseMessage>
            {
                MaxRetryAttempts = MaxRetryAttempts,
                ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                    .Handle<HttpRequestException>()
                    .HandleResult(ShouldRetryHttpResponse),
                DelayGenerator = args =>
                {
                    TimeSpan delay = sleepDurationProvider(args.AttemptNumber);

                    return new ValueTask<TimeSpan?>(delay);
                },
                OnRetry = args =>
                {
                    TryLog(logger, args);

                    return ValueTask.CompletedTask;
                },
            })
            .Build();

        return pipeline.AsAsyncPolicy();
    }

    private static TimeSpan ProductionSleepDurationProvider(int attemptNumber) => TimeSpan.FromSeconds(Math.Pow(2, attemptNumber));

    private static bool ShouldRetryHttpResponse(HttpResponseMessage response)
    {
        HttpStatusCode code = response.StatusCode;

        if (code == HttpStatusCode.RequestTimeout)
            return true;

        if (code == HttpStatusCode.TooManyRequests)
            return true;

        return (int)code >= 500 && (int)code <= 599;
    }

    private static void TryLog(ILogger logger, OnRetryArguments<HttpResponseMessage> args)
    {
        if (!logger.IsEnabled(LogLevel.Warning))

            return;

        HttpResponseMessage? result = args.Outcome.Result;

        if (result is not null)

            logger.LogWarning(
                "Azure ARM / Retail Prices HTTP outbound scheduling retry after HTTP {HttpStatus}; attempt {RetryAttempt} of {MaxRetries} (delay {RetryDelay}).",
                (int)result.StatusCode,
                args.AttemptNumber,
                MaxRetryAttempts,
                args.RetryDelay);

        else if (args.Outcome.Exception is Exception ex)

            logger.LogWarning(
                ex,
                "Azure ARM / Retail Prices HTTP outbound scheduling retry after transport fault; attempt {RetryAttempt} of {MaxRetries} (delay {RetryDelay}).",
                args.AttemptNumber,
                MaxRetryAttempts,
                args.RetryDelay);
    }
}
