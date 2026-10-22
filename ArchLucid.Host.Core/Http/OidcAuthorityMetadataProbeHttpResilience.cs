using System.Net;

using Polly;
using Polly.Retry;

namespace ArchLucid.Host.Core.Http;

/// <summary>Transient retry policy for OIDC <c>/.well-known/openid-configuration</c> probes (Improvement #22).</summary>
public static class OidcAuthorityMetadataProbeHttpResilience
{
    public const int MaxRetryAttempts = 3;

    private static readonly TimeSpan DefaultBaseDelay = TimeSpan.FromSeconds(1);

    public static ResiliencePipeline<HttpResponseMessage> BuildPipeline(
        Func<int, TimeSpan>? sleepDurationProvider = null)
    {
        return new ResiliencePipelineBuilder<HttpResponseMessage>()
            .AddRetry(new RetryStrategyOptions<HttpResponseMessage>
            {
                MaxRetryAttempts = MaxRetryAttempts,
                ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                    .Handle<HttpRequestException>()
                    .HandleResult(ShouldRetryResponse),
                DelayGenerator = args =>
                {
                    TimeSpan delay = sleepDurationProvider?.Invoke(args.AttemptNumber)
                        ?? TimeSpan.FromMilliseconds(
                            DefaultBaseDelay.TotalMilliseconds * Math.Pow(2, args.AttemptNumber - 1));

                    return new ValueTask<TimeSpan?>(delay);
                },
                UseJitter = true,
            })
            .Build();
    }

    public static bool ShouldRetryResponse(HttpResponseMessage response)
    {
        ArgumentNullException.ThrowIfNull(response);

        if ((int)response.StatusCode >= 500)
            return true;

        return response.StatusCode is HttpStatusCode.RequestTimeout or HttpStatusCode.TooManyRequests;
    }
}
