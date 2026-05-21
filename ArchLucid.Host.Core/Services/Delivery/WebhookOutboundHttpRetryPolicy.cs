using System.Net;

using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Http;

using Polly;

namespace ArchLucid.Host.Core.Services.Delivery;

/// <summary>
/// Polly outbound retry for the named <see cref="HttpWebhookPoster" /> client (<c>ArchLucidWebhooks</c>).
/// Registered on the webhook <see cref="IHttpClientBuilder" /> with <c>AddPolicyHandler</c>.
/// </summary>
/// <remarks>
/// Polly v8 uses <see cref="ResiliencePipeline{HttpResponseMessage}" />; bridging to legacy
/// <see cref="IAsyncPolicy{TResult}" /> preserves out-of-box <c>Microsoft.Extensions.Http.Polly</c> <c>AddPolicyHandler</c> integration.
/// The v7-era <c>AsyncRetryPolicy{T}</c> type does not compile under centrally managed Polly 8.x.
/// </remarks>
public static class WebhookOutboundHttpRetryPolicy
{
    public const int ProductionRetryAttempts = 3;

    /// <summary>
    /// Builds the production policy: handles <see cref="HttpRequestException" />, HTTP 408, any 5xx,
    /// and 429 (<see cref="HttpStatusCode.TooManyRequests" />). Exponential delays (~2 s, ~4 s, ~8 s) between attempts.
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> Create() =>
        Create(static retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));

    /// <summary>
    /// Identical fault handling as the parameterless overload but callers may replace backoff (for example zero delay for tests).
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> Create(Func<int, TimeSpan> sleepDurationProvider)
    {
        ArgumentNullException.ThrowIfNull(sleepDurationProvider);

        OutboundExternalHttpResilienceOptions options = new() { MaxRetryAttempts = ProductionRetryAttempts };

        return OutboundExternalHttpResiliencePolicy.Create(options, sleepDurationProvider);
    }
}
