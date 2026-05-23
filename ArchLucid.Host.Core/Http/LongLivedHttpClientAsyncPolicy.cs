using Polly;

namespace ArchLucid.Host.Core.Http;

/// <summary>
///     Holds one <see cref="IAsyncPolicy{TResult}" /> instance for a named <see cref="HttpClient" /> registration.
/// </summary>
/// <remarks>
///     Circuit breaker and bulkhead strategies are stateful. When
///     <see cref="Microsoft.Extensions.DependencyInjection.PollyHttpClientBuilderExtensions.AddPolicyHandler" />
///     uses a per-request selector, returning a freshly built policy on every call prevents failures from accumulating.
/// </remarks>
internal sealed class LongLivedHttpClientAsyncPolicy<T>(Func<IServiceProvider, IAsyncPolicy<T>> factory)
{
    private readonly Func<IServiceProvider, IAsyncPolicy<T>> _factory =
        factory ?? throw new ArgumentNullException(nameof(factory));

    private IAsyncPolicy<T>? _policy;

    public IAsyncPolicy<T> Get(IServiceProvider serviceProvider) =>
        _policy ??= _factory(serviceProvider);
}
