namespace ArchLucid.Api.Tests;

/// <summary>
///     Bounded <see cref="AlertLifecycleWebAppFactory" /> host startup for integration tests.
/// </summary>
internal static class AlertLifecycleIntegrationHost
{
    internal static Task<IServiceProvider> EnsureStartedAsync(AlertLifecycleWebAppFactory factory)
    {
        ArgumentNullException.ThrowIfNull(factory);

        return IntegrationTestHostStartup.EnsureStartedAsync(() => factory.Services);
    }
}
