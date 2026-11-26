using Microsoft.Extensions.DependencyInjection;

using Polly;

namespace ArchLucid.Host.Core.Http;

/// <summary>
///     Helpers for attaching stateful Polly policies to <see cref="IHttpClientBuilder" /> registrations.
/// </summary>
public static class HttpClientBuilderPolicyExtensions
{
    private static readonly IAsyncPolicy<HttpResponseMessage> NoOpPolicy = Policy.NoOpAsync<HttpResponseMessage>();

    /// <summary>
    ///     Registers a policy selector that reuses the same <see cref="IAsyncPolicy{HttpResponseMessage}" /> instance across requests.
    /// </summary>
    public static IHttpClientBuilder AddLongLivedPolicyHandler(
        this IHttpClientBuilder builder,
        Func<IServiceProvider, IAsyncPolicy<HttpResponseMessage>> policyFactory) =>
        AddLongLivedPolicyHandler(builder, policyFactory, appliesToRequest: null);

    /// <summary>
    ///     Applies the shared policy only to matching requests.
    /// </summary>
    public static IHttpClientBuilder AddLongLivedPolicyHandler(
        this IHttpClientBuilder builder,
        Func<IServiceProvider, IAsyncPolicy<HttpResponseMessage>> policyFactory,
        Func<HttpRequestMessage, bool>? appliesToRequest)
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentNullException.ThrowIfNull(policyFactory);

        LongLivedHttpClientAsyncPolicy<HttpResponseMessage> reference = new(policyFactory);

        return builder.AddPolicyHandler((serviceProvider, request) =>
            appliesToRequest is null || appliesToRequest(request) ? reference.Get(serviceProvider) : NoOpPolicy);
    }
}
