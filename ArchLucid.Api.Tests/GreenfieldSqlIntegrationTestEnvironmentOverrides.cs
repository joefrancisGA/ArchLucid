namespace ArchLucid.Api.Tests;

/// <summary>
///     Process-wide storage env override for greenfield SQL integration hosts. <see cref="Program" /> calls
///     <c>AddEnvironmentVariables()</c> after JSON files, so env wins over <c>appsettings.Development.json</c>
///     (<c>StorageProvider=InMemory</c>) when <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" />
///     registers DI before late <see cref="Microsoft.AspNetCore.Hosting.IWebHostBuilder.ConfigureAppConfiguration" /> merges.
///     Reference-counted <see cref="Apply" /> / <see cref="Clear" /> pairs avoid clearing the variable while another
///     factory in a parallel collection is still building its host (which would register InMemory DI but Sql startup).
/// </summary>
internal static class GreenfieldSqlIntegrationTestEnvironmentOverrides
{
    private const string StorageProviderKey = "ArchLucid__StorageProvider";

    private const string SqlValue = "Sql";

    private static readonly object Gate = new();

    private static int _activeFactories;

    private static bool _mutatedEnvironment;

    internal static void Apply()
    {
        lock (Gate)
        {
            if (_activeFactories++ != 0)
            {
                return;
            }

            string? existing = Environment.GetEnvironmentVariable(StorageProviderKey);

            if (!string.IsNullOrEmpty(existing))
            {
                _mutatedEnvironment = false;
                return;
            }

            Environment.SetEnvironmentVariable(StorageProviderKey, SqlValue);
            _mutatedEnvironment = true;
        }
    }

    internal static void Clear()
    {
        lock (Gate)
        {
            if (_activeFactories <= 0)
            {
                return;
            }

            if (--_activeFactories > 0)
            {
                return;
            }

            if (_mutatedEnvironment)
            {
                Environment.SetEnvironmentVariable(StorageProviderKey, null);
            }

            _mutatedEnvironment = false;
        }
    }
}
