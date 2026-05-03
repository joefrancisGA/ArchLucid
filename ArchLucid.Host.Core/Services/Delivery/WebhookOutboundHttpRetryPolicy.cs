using System.Net;

using Polly;
using Polly.Extensions.Http;

namespace ArchLucid.Host.Core.Services.Delivery;

/// <summary>
/// Polly outbound retry for the named <see cref="HttpWebhookPoster" /> client (<c>ArchLucidWebhooks</c>).
/// Registered on the webhook <see cref="IHttpClientBuilder" /> with <c>AddPolicyHandler</c>.
/// </summary>
public static class WebhookOutboundHttpRetryPolicy
{
    public const int ProductionRetryAttempts = 3;

    /// <summary>
    /// Builds the production policy: handles <see cref="HttpRequestException" />, HTTP 408, any 5xx,
    /// and 429 (<see cref="HttpStatusCode.TooManyRequests" />). Exponential delays (~2 s, ~4 s, ~8 s) between attempts.
    /// </summary>
    public static AsyncRetryPolicy<HttpResponseMessage> Create() =>
        Create(static retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));

    /// <summary>
    /// Identical fault handling as the parameterless overload but callers may replace backoff (for example zero delay for tests).
    /// </summary>
    public static AsyncRetryPolicy<HttpResponseMessage> Create(Func<int, TimeSpan> sleepDurationProvider)
    {
        ArgumentNullException.ThrowIfNull(sleepDurationProvider);

        AsyncRetryPolicy<HttpResponseMessage> policy = HttpPolicyExtensions
            .HandleTransientHttpError()
            .OrResult(static r => r.StatusCode == HttpStatusCode.TooManyRequests)
            .WaitAndRetryAsync(ProductionRetryAttempts, sleepDurationProvider);

        return policy;
    }
}
