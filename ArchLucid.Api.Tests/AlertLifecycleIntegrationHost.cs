namespace ArchLucid.Api.Tests;

/// <summary>
///     Bounded <see cref="AlertLifecycleWebAppFactory" /> host startup and client creation for integration tests.
/// </summary>
internal static class AlertLifecycleIntegrationHost
{
    internal static Task<IServiceProvider> EnsureStartedAsync(AlertLifecycleWebAppFactory factory)
    {
        ArgumentNullException.ThrowIfNull(factory);

        return factory.EnsureServicesStartedAsync();
    }

    internal static Task<HttpClient> EnsureClientAsync(AlertLifecycleWebAppFactory factory)
    {
        ArgumentNullException.ThrowIfNull(factory);

        return factory.CreateBoundedClientAsync();
    }
}
