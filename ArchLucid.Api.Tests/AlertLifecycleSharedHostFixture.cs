namespace ArchLucid.Api.Tests;

/// <summary>
///     One warmed <see cref="AlertLifecycleWebAppFactory" /> per test class so Ask integration tests do not each
///     cold-boot the API host under CI thread-pool pressure (CI #2378).
/// </summary>
public sealed class AlertLifecycleSharedHostFixture : IAsyncLifetime
{
    internal AlertLifecycleWebAppFactory Factory { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        Console.Error.WriteLine(
            $"[AlertLifecycleSharedHostFixture] InitializeAsync starting at {DateTime.UtcNow:HH:mm:ss.fff}Z");

        Factory = new AlertLifecycleWebAppFactory();
        await AlertLifecycleIntegrationHost.EnsureStartedAsync(Factory);

        Console.Error.WriteLine(
            $"[AlertLifecycleSharedHostFixture] InitializeAsync complete at {DateTime.UtcNow:HH:mm:ss.fff}Z");
    }

    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync();
    }
}
