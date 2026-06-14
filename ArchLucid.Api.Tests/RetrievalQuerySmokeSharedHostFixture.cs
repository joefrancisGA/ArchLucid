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
        Factory = new AlertLifecycleWebAppFactory();
        await AlertLifecycleIntegrationHost.EnsureStartedAsync(Factory);
    }

    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync();
    }
}
