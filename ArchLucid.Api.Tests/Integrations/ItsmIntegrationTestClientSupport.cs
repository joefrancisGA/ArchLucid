namespace ArchLucid.Api.Tests.Integrations;

/// <summary>Scoped SQL integration client bootstrap for ITSM endpoint tests.</summary>
public static class ItsmIntegrationTestClientSupport
{
    public static HttpClient CreateScopedClient(ArchLucidApiFactory factory)
    {
        ArgumentNullException.ThrowIfNull(factory);

        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        return client;
    }

    public static async Task<HttpClient> CreateDemoSeededClientAsync(
        ArchLucidApiFactory factory,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);

        HttpClient client = CreateScopedClient(factory);
        await HarnessDemoBaselineSupport.EnsureSeededAsync(factory.Services, cancellationToken).ConfigureAwait(false);

        return client;
    }
}
