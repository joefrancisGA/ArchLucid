using System.Net;
using System.Net.Http.Headers;

using Microsoft.Extensions.Logging;

using Polly;
using Polly.Retry;

namespace ArchLucid.Host.Core.Http;

/// <summary>Plans each safe-read retry against the provider wait and the remaining HTTP call budget.</summary>
internal sealed class DeadlineAwareReadRetryTiming(TimeProvider clock, TimeSpan callBudget, int maxRetryAttempts)
    : ResilienceStrategy<HttpResponseMessage>
{
    private static readonly ResiliencePropertyKey<long> StartedAt = new("OutboundRead.CallStartedAt");
    private static readonly ResiliencePropertyKey<TimeSpan> PlannedDelay = new("OutboundRead.NextRetryDelay");

    public TimeProvider Clock => clock;

    public RetryStrategyOptions<HttpResponseMessage> CreateRetryOptions(ILogger logger) =>
        new()
        {
            MaxRetryAttempts = maxRetryAttempts,
            ShouldHandle = PlanRetry,
            DelayGenerator = static args => new ValueTask<TimeSpan?>(
                args.Context.Properties.GetValue(PlannedDelay, TimeSpan.Zero)),
            OnRetry = args =>
            {
                AzureRmAndRetailPricesHttpRetryPolicy.TryLogRetry(logger, args);

                return ValueTask.CompletedTask;
            },
        };

    public static TimeSpan GetExponentialDelay(int attempt) => TimeSpan.FromSeconds(Math.Pow(2, attempt));

    private ValueTask<bool> PlanRetry(RetryPredicateArguments<HttpResponseMessage> args)
    {
        HttpResponseMessage? response = args.Outcome.Result;

        if (args.AttemptNumber >= maxRetryAttempts ||
            (args.Outcome.Exception is not HttpRequestException &&
             (response is null || !AzureRmAndRetailPricesHttpRetryPolicy.ShouldRetryHttpResponse(response))))
        {
            return new ValueTask<bool>(false);
        }

        // Spread local retries without letting jitter undercut a provider's minimum wait.
        const double maxJitterFraction = 0.25;
        TimeSpan delay = GetExponentialDelay(args.AttemptNumber) * (1 + (Random.Shared.NextDouble() * maxJitterFraction));

        if (response?.StatusCode is HttpStatusCode.TooManyRequests or HttpStatusCode.ServiceUnavailable &&
            response.Headers.RetryAfter is { } retryAfter)
        {
            TimeSpan serverDelay = ResolveServerDelay(retryAfter);
            delay = serverDelay > delay ? serverDelay : delay;
        }

        long start = args.Context.Properties.GetValue(StartedAt, 0L);
        TimeSpan remaining = callBudget - clock.GetElapsedTime(start);

        if (delay >= remaining)
        {
            // Returning false leaves the last response intact for the caller.
            return new ValueTask<bool>(false);
        }

        args.Context.Properties.Set(PlannedDelay, delay);

        return new ValueTask<bool>(true);
    }

    protected override ValueTask<Outcome<HttpResponseMessage>> ExecuteCore<TState>(
        Func<ResilienceContext, TState, ValueTask<Outcome<HttpResponseMessage>>> callback,
        ResilienceContext context,
        TState state)
    {
        context.Properties.Set(StartedAt, clock.GetTimestamp());

        return callback(context, state);
    }

    private TimeSpan ResolveServerDelay(RetryConditionHeaderValue retryAfter) =>
        retryAfter.Delta ?? (retryAfter.Date is { } retryAt ? retryAt - clock.GetUtcNow() : TimeSpan.Zero);
}
