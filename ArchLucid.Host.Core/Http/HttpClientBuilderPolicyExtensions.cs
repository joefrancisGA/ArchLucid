using Microsoft.Extensions.DependencyInjection;

using Polly;

namespace ArchLucid.Host.Core.Http;

/// <summary>
///     Helpers for attaching stateful Polly policies to <see cref="IHttpClientBuilder" /> registrations.
/// </summary>
public static class HttpClientBuilderPolicyExtensions
{
    /// <summary>
    ///     Registers a policy selector that reuses the same <see cref="IAsyncPolicy{HttpResponseMessage}" /> instance across requests.
    /// </summary>
    public static IHttpClientBuilder AddLongLivedPolicyHandler(
        this IHttpClientBuilder builder,
        Func<IServiceProvider, IAsyncPolicy<HttpResponseMessage>> policyFactory)
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentNullException.ThrowIfNull(policyFactory);

        LongLivedHttpClientAsyncPolicy<HttpResponseMessage> reference = new(policyFactory);

        return builder.AddPolicyHandler((serviceProvider, _) => reference.Get(serviceProvider));
    }
}
