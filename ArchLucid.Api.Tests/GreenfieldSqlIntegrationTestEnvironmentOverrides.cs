namespace ArchLucid.Api.Tests;

/// <summary>
///     Process-wide storage env override for greenfield SQL integration hosts. <see cref="Program" /> calls
///     <c>AddEnvironmentVariables()</c> after JSON files, so env wins over <c>appsettings.Development.json</c>
///     (<c>StorageProvider=InMemory</c>) when <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" />
///     registers DI before late <see cref="Microsoft.AspNetCore.Hosting.IWebHostBuilder.ConfigureAppConfiguration" /> merges.
///     Pair <see cref="Apply" /> with <see cref="Clear" /> on factory dispose so Sql and InMemory profiles do not leak
///     across factories in one process.
/// </summary>
internal static class GreenfieldSqlIntegrationTestEnvironmentOverrides
{
    private const string StorageProviderKey = "ArchLucid__StorageProvider";

    internal static void Apply()
    {
        Environment.SetEnvironmentVariable(StorageProviderKey, "Sql");
    }

    internal static void Clear()
    {
        Environment.SetEnvironmentVariable(StorageProviderKey, null);
    }
}
