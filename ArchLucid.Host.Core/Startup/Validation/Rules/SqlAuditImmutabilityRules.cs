using System.Data;

using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

/// <summary>
///     Production-like startup probe: <c>dbo.AuditEvents</c> must be append-only for the runtime SQL principal
///     (<c>[ArchLucidApp]</c> role with DENY UPDATE/DELETE per migration 051).
/// </summary>
internal static class SqlAuditImmutabilityRules
{
    private const string AuditEventsTableName = "dbo.AuditEvents";

    internal static bool ShouldValidate(
        IHostEnvironment environment,
        IConfiguration configuration,
        ArchLucidOptions archLucidOptions)
    {
        ArgumentNullException.ThrowIfNull(environment);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(archLucidOptions);

        if (!ArchLucidOptions.EffectiveIsSql(archLucidOptions.StorageProvider))
            return false;

        return HostEnvironmentClassification.IsProductionOrStagingLike(environment, configuration);
    }

    internal static string? ResolveAuditCatalogConnectionString(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        SqlTopologyOptions topology =
            configuration.GetSection(SqlTopologyOptions.SectionPath).Get<SqlTopologyOptions>() ?? new SqlTopologyOptions();

        if (topology.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs)
        {
            if (!string.IsNullOrWhiteSpace(topology.DevelopmentTenantConnectionString))
                return topology.DevelopmentTenantConnectionString.Trim();

            return null;
        }

        return ArchLucidConfigurationBridge.ResolveSqlConnectionString(configuration);
    }

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
                    "Audit immutability: database role [ArchLucidApp] is missing. Create the role, grant least-privilege DML, "
                    + "and add the runtime managed identity as a member (see docs/security/MANAGED_IDENTITY_SQL_BLOB.md).");
            }
            else
            {
                if (!SqlDatabaseImmutabilityProbeHelpers.HasDenyPermission(
                        connection,
                        AuditEventsTableName,
                        SqlDatabaseImmutabilityProbeHelpers.ApplicationDatabaseRoleName,
                        "UPDATE"))
                {
                    errors.Add(
                        "Audit immutability: DENY UPDATE on dbo.AuditEvents for [ArchLucidApp] is missing "
                        + "(migration 051 / append-only audit).");
                }

                if (!SqlDatabaseImmutabilityProbeHelpers.HasDenyPermission(
                        connection,
                        AuditEventsTableName,
                        SqlDatabaseImmutabilityProbeHelpers.ApplicationDatabaseRoleName,
                        "DELETE"))
                {
                    errors.Add(
                        "Audit immutability: DENY DELETE on dbo.AuditEvents for [ArchLucidApp] is missing "
                        + "(migration 051 / append-only audit).");
                }
            }

            if (SqlDatabaseImmutabilityProbeHelpers.ObjectExists(connection, AuditEventsTableName))
            {
                if (SqlDatabaseImmutabilityProbeHelpers.HasEffectivePermission(connection, AuditEventsTableName, "UPDATE"))
                {
                    errors.Add(
                        "Audit immutability: the connected SQL principal has UPDATE on dbo.AuditEvents; "
                        + "connect as [ArchLucidApp] (not db_owner/dbo) in production-like hosts.");
                }

                if (SqlDatabaseImmutabilityProbeHelpers.HasEffectivePermission(connection, AuditEventsTableName, "DELETE"))
                {
                    errors.Add(
                        "Audit immutability: the connected SQL principal has DELETE on dbo.AuditEvents; "
                        + "connect as [ArchLucidApp] (not db_owner/dbo) in production-like hosts.");
                }
            }
            else
            {
                errors.Add("Audit immutability: dbo.AuditEvents does not exist after migrations.");
            }
        }
        catch (Exception ex)
        {
            errors.Add($"Audit immutability probe failed: {ex.Message}");
        }

        if (errors.Count == 0)
        {
            logger.LogInformation("Startup: audit immutability probe passed (dbo.AuditEvents append-only for runtime principal).");

            return;
        }

        throw new InvalidOperationException(
            "Audit immutability validation failed in a production-like host:"
            + Environment.NewLine
            + string.Join(Environment.NewLine, errors.Select(static e => " - " + e)));
    }
}
