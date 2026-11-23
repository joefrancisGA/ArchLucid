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
    // App runtime uses owned procedures for updates: direct instance UPDATE/DELETE is denied.
    // Kept separate from migration-247 registry parity (these objects are
    // created later by migration 360 and secured in migration 426).
    private static readonly (string TableName, string Permission)[] RemediationDenyPermissions =
    [
        ("dbo.RemediationInstances", "DELETE"),
        ("dbo.RemediationInstances", "UPDATE"),
        ("dbo.RemediationEvidence", "UPDATE"),
        ("dbo.RemediationEvidence", "DELETE"),
    ];

    private static readonly (string TableName, string Permission)[] RemediationRequiredPermissions =
    [
        ("dbo.RemediationInstances", "SELECT"),
        ("dbo.RemediationInstances", "INSERT"),
        ("dbo.RemediationEvidence", "SELECT"),
        ("dbo.RemediationEvidence", "INSERT"),
    ];

    private static readonly string[] RemediationRequiredProcedures =
    [
        "dbo.uspRemediationUpdateScoped",
        "dbo.uspRemediationCommitApproval",
        "dbo.uspRemediationCommitVerification",
    ];

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
                if (!SqlDatabaseImmutabilityProbeHelpers.IsCurrentPrincipalRoleMember(
                        connection, SqlDatabaseImmutabilityProbeHelpers.ApplicationDatabaseRoleName))
                {
                    errors.Add(
                        "Remediation SQL permissions: the connected runtime SQL principal is not a member "
                        + "of [ArchLucidApp]. Migrations must use a separately elevated identity.");
                }

                foreach ((string tableName, string permissionName) in SqlDatabaseImmutabilityProbeHelpers.CollectMissingDenyPermissions(
                             connection,
                             SealedEvidenceTableRegistry.SealedTableNames,
                             SqlDatabaseImmutabilityProbeHelpers.ApplicationDatabaseRoleName))
                {
                    errors.Add(
                        $"Sealed evidence immutability: DENY {permissionName} on {tableName} for [ArchLucidApp] is missing (migration 247).");
                }

                foreach ((string tableName, string permissionName) in RemediationDenyPermissions)
                {
                    if (!SqlDatabaseImmutabilityProbeHelpers.ObjectExists(connection, tableName))
                    {
                        errors.Add($"Remediation SQL permissions: {tableName} is missing after migration 360.");
                    }
                    else if (!SqlDatabaseImmutabilityProbeHelpers.HasDenyPermission(
                                 connection, tableName,
                                 SqlDatabaseImmutabilityProbeHelpers.ApplicationDatabaseRoleName,
                                 permissionName))
                    {
                        errors.Add(
                            $"Remediation SQL permissions: DENY {permissionName} on {tableName} for [ArchLucidApp] is missing (migrations 426/427).");
                    }
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

            foreach (string procedureName in RemediationRequiredProcedures)
            {
                if (!SqlDatabaseImmutabilityProbeHelpers.ProcedureExists(connection, procedureName))
                    errors.Add($"Remediation SQL permissions: required procedure {procedureName} is missing (migration 427).");
                else if (!SqlDatabaseImmutabilityProbeHelpers.HasEffectivePermission(connection, procedureName, "EXECUTE"))
                    errors.Add($"Remediation SQL permissions: runtime principal lacks EXECUTE on {procedureName}.");
            }

            foreach ((string tableName, string permissionName) in RemediationDenyPermissions)
            {
                if (SqlDatabaseImmutabilityProbeHelpers.ObjectExists(connection, tableName)
                    && SqlDatabaseImmutabilityProbeHelpers.HasEffectivePermission(
                        connection, tableName, permissionName))
                {
                    errors.Add(
                        $"Remediation SQL permissions: the connected runtime principal has {permissionName} on {tableName}; "
                        + "use a least-privilege member of [ArchLucidApp], not dbo/db_owner.");
                }
            }

            foreach ((string tableName, string permissionName) in RemediationRequiredPermissions)
            {
                if (SqlDatabaseImmutabilityProbeHelpers.ObjectExists(connection, tableName)
                    && !SqlDatabaseImmutabilityProbeHelpers.HasEffectivePermission(
                        connection, tableName, permissionName))
                {
                    errors.Add(
                        $"Remediation SQL permissions: the runtime principal lacks required {permissionName} on {tableName}. "
                        + "Preserve repository SELECT/INSERT and stored-procedure EXECUTE rights.");
                }
            }
        }
        catch (Exception ex)
        {
            errors.Add($"Sealed evidence immutability probe failed: {ex.Message}");
        }

        if (errors.Count == 0)
        {
            logger.LogInformation(
                "Startup: sealed evidence immutability probe passed ({SealedTableCount} sealed tables, {RemediationDenyCount} remediation role DENYs).",
                SealedEvidenceTableRegistry.SealedTableNames.Count,
                RemediationDenyPermissions.Length);

            return;
        }

        throw new InvalidOperationException(
            "Sealed evidence immutability validation failed in a production-like host:"
            + Environment.NewLine
            + string.Join(Environment.NewLine, errors.Select(static e => " - " + e)));
    }
}
