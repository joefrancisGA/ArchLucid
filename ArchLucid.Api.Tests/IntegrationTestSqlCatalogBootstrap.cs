using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Idempotent SQL catalog prep for integration hosts that provision a catalog but may not run full persistence
///     startup (<c>ArchLucid:StorageProvider=InMemory</c> authority hosts still carry
///     <see cref="SqlIntegrationTestWebAppFactoryBase.SqlConnectionString" /> for tier/SQL probes).
/// </summary>
internal static class IntegrationTestSqlCatalogBootstrap
{
    internal static void EnsureMigratedAndDefaultScope(string? sqlConnectionString)
    {
        if (string.IsNullOrWhiteSpace(sqlConnectionString))
            return;

        try
        {
            DatabaseMigrator.Run(sqlConnectionString);
        }
        catch (Exception ex) when (IsAlreadyMigratedOrPartiallyApplied(ex))
        {
            // DbUp or bootstrap may have run during WebApplicationFactory startup; idempotent re-run is fine.
        }

        DevelopmentDefaultScopeTenantBootstrap.TryEnsure(
            sqlConnectionString,
            NullLogger.Instance);
    }

    private static bool IsAlreadyMigratedOrPartiallyApplied(Exception ex)
    {
        for (Exception? current = ex; current is not null; current = current.InnerException)
        {
            string message = current.Message;

            if (message.Contains("already an object named", StringComparison.OrdinalIgnoreCase)
                || message.Contains("There is already an object", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
