namespace ArchLucid.Api.Tests;

/// <summary>
///     Single entry for SQL integration <see cref="HttpClient" /> setup (bounded client, scope headers, workspace pin).
/// </summary>
public static class IntegrationTestSqlClientBootstrap
{
    /// <summary>
    ///     Matches <see cref="IntegrationTestBase.InitializeAsync" />: bounded client, development scope headers, guided
    ///     workspace pin.
    /// </summary>
    public static async Task<HttpClient> CreateSqlIntegrationClientAsync(
        ArchLucidApiFactory factory,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);

        HttpClient client = await factory.CreateBoundedClientAsync().ConfigureAwait(false);
        WireDefaultSqlIntegrationScopeHeaders(client);
        await IntegrationTestWorkspaceModeSupport
            .PinGuidedWorkspaceModeForDevUserAsync(factory, cancellationToken)
            .ConfigureAwait(false);

        return client;
    }

    /// <summary>Scope headers for clients created outside this bootstrap (e.g. custom factory <c>CreateClient</c>).</summary>
    public static void WireDefaultSqlIntegrationScopeHeaders(HttpClient client) =>
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
}
