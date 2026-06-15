namespace ArchLucid.Api.Tests;

/// <summary>
///     One warmed <see cref="AlertLifecycleWebAppFactory" /> per test class so retrieval smoke tests (including the
///     empty-index assertion) do not each cold-boot the API host under CI load.
/// </summary>
public sealed class RetrievalQuerySmokeSharedHostFixture : IAsyncLifetime
{
    internal AlertLifecycleWebAppFactory Factory { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        Console.Error.WriteLine(
            $"[RetrievalQuerySmokeSharedHostFixture] InitializeAsync starting at {DateTime.UtcNow:HH:mm:ss.fff}Z");

        Factory = new AlertLifecycleWebAppFactory();
        await AlertLifecycleIntegrationHost.EnsureStartedAsync(Factory);

        Console.Error.WriteLine(
            $"[RetrievalQuerySmokeSharedHostFixture] InitializeAsync complete at {DateTime.UtcNow:HH:mm:ss.fff}Z");
    }

    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync();
    }
}
