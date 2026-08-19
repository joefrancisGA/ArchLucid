using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

/// <summary>
///     Production-like startup probe: commit-sealed evidence tables must be append-only for <c>[ArchLucidApp]</c>
///     (DENY UPDATE/DELETE per migration 247; audit also migration 051).
/// </summary>
internal static class SqlSealedEvidenceImmutabilityRules
{
    internal static bool ShouldValidate(
        IHostEnvironment environment,
        IConfiguration configuration,
        ArchLucidOptions archLucidOptions)
        => SqlAuditImmutabilityRules.ShouldValidate(environment, configuration, archLucidOptions);

    internal static string? ResolveCatalogConnectionString(IConfiguration configuration)
        => SqlAuditImmutabilityRules.ResolveAuditCatalogConnectionString(configuration);

    internal static void ValidateOrThrow(string rawConnectionString, ILogger logger)
    {
        ArgumentNullException.ThrowIfNull(rawConnectionString);
        ArgumentNullException.ThrowIfNull(logger);

        string connectionString =
            SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(rawConnectionString.Trim());

        List<string> errors = [];

        try
        {
            using SqlConnection connection = new(connectionString);
            connection.Open();

            if (!SqlDatabaseImmutabilityProbeHelpers.RoleExists(connection, SqlDatabaseImmutabilityProbeHelpers.ApplicationDatabaseRoleName))
            {
                errors.Add(
                    "Sealed evidence immutability: database role [ArchLucidApp] is missing. Create the role, grant least-privilege DML, "
                    + "and add the runtime managed identity as a member (see docs/security/MANAGED_IDENTITY_SQL_BLOB.md).");
            }
            else
            {
                foreach ((string tableName, string permissionName) in SqlDatabaseImmutabilityProbeHelpers.CollectMissingDenyPermissions(
                             connection,
                             SealedEvidenceTableRegistry.SealedTableNames,
                             SqlDatabaseImmutabilityProbeHelpers.ApplicationDatabaseRoleName))
                {
                    errors.Add(
                        $"Sealed evidence immutability: DENY {permissionName} on {tableName} for [ArchLucidApp] is missing (migration 247).");
                }
            }

            foreach ((string tableName, string permissionName) in SqlDatabaseImmutabilityProbeHelpers.CollectEffectivePermissionViolations(
                         connection,
                         SealedEvidenceTableRegistry.SealedTableNames))
            {
                errors.Add(
                    $"Sealed evidence immutability: the connected SQL principal has {permissionName} on {tableName}; "
                    + "connect as [ArchLucidApp] (not db_owner/dbo) in production-like hosts.");
            }
        }
        catch (Exception ex)
        {
            errors.Add($"Sealed evidence immutability probe failed: {ex.Message}");
        }

        if (errors.Count == 0)
        {
            logger.LogInformation(
                "Startup: sealed evidence immutability probe passed ({TableCount} tables append-only for runtime principal).",
                SealedEvidenceTableRegistry.SealedTableNames.Count);

            return;
        }

        throw new InvalidOperationException(
            "Sealed evidence immutability validation failed in a production-like host:"
            + Environment.NewLine
            + string.Join(Environment.NewLine, errors.Select(static e => " - " + e)));
    }
}
