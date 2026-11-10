namespace ArchLucid.Api.Tests;

/// <summary>
///     Per-test <see cref="ArchLucidApiFactory" /> bootstrap when a class cannot use <see cref="IntegrationTestBase" />
///     (isolated SQL database per test method).
/// </summary>
public static class IntegrationTestIsolatedSqlScope
{
    /// <summary>Wires scope headers and guided workspace mode the same way <see cref="IntegrationTestBase" /> does.</summary>
    public static async Task RunAsync(Func<HttpClient, ArchLucidApiFactory, Task> act)
    {
        ArgumentNullException.ThrowIfNull(act);

        await using ArchLucidApiFactory factory = new();
        HttpClient client = await factory.CreateBoundedClientAsync().ConfigureAwait(false);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        await IntegrationTestWorkspaceModeSupport.PinGuidedWorkspaceModeForDevUserAsync(factory).ConfigureAwait(false);
        await act(client, factory).ConfigureAwait(false);
    }

    /// <summary>Isolated factory plus <see cref="ReplaySession" /> (comparison replay golden path).</summary>
    public static async Task RunWithReplayAsync(Func<ReplaySession, ArchLucidApiFactory, Task> act)
    {
        ArgumentNullException.ThrowIfNull(act);

        await using ArchLucidApiFactory factory = new();
        ReplaySession replay = await ReplaySession.OpenAsync(factory).ConfigureAwait(false);
        await act(replay, factory).ConfigureAwait(false);
    }
}
