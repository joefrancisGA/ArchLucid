using ArchLucid.TestSupport;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Ensures ephemeral SQL catalogs drop even when <see cref="IntegrationTestWebAppFactoryHostLifecycle" /> abandons a
///     wedged <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> dispose (CI #2224).
/// </summary>
internal static class IntegrationTestOwnedSqlCatalogDispose
{
    internal static async ValueTask DisposeHostAndDropOwnedCatalogAsync(
        string logPrefix,
        IntegrationTestWebAppFactoryHostLifecycle hostLifecycle,
        Func<ValueTask> baseDisposeAsync,
        string? ownedCatalogConnectionString)
    {
        try
        {
            await hostLifecycle.DisposeHostAsync(logPrefix, baseDisposeAsync).ConfigureAwait(false);
        }
        finally
        {
            TryDropOwnedCatalog(ownedCatalogConnectionString);
        }
    }

    internal static void TryDropOwnedCatalog(string? ownedCatalogConnectionString)
    {
        if (string.IsNullOrWhiteSpace(ownedCatalogConnectionString))
            return;

        try
        {
            SqlServerTestCatalogCommands.DropCatalogIfExists(ownedCatalogConnectionString);
        }
        catch
        {
            // Best-effort cleanup (SQL Server may be unavailable on teardown).
        }
    }
}
