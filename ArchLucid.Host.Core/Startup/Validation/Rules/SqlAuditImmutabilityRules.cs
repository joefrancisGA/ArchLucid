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

            if (!RoleExists(connection, "ArchLucidApp"))
            {
                errors.Add(
                    "Audit immutability: database role [ArchLucidApp] is missing. Create the role, grant least-privilege DML, "
                    + "and add the runtime managed identity as a member (see docs/security/MANAGED_IDENTITY_SQL_BLOB.md).");
            }
            else
            {
                if (!HasDenyPermission(connection, "ArchLucidApp", "UPDATE"))
                {
                    errors.Add(
                        "Audit immutability: DENY UPDATE on dbo.AuditEvents for [ArchLucidApp] is missing "
                        + "(migration 051 / append-only audit).");
                }

                if (!HasDenyPermission(connection, "ArchLucidApp", "DELETE"))
                {
                    errors.Add(
                        "Audit immutability: DENY DELETE on dbo.AuditEvents for [ArchLucidApp] is missing "
                        + "(migration 051 / append-only audit).");
                }
            }

            if (ObjectExists(connection, "dbo.AuditEvents"))
            {
                if (HasEffectivePermission(connection, "UPDATE"))
                {
                    errors.Add(
                        "Audit immutability: the connected SQL principal has UPDATE on dbo.AuditEvents; "
                        + "connect as [ArchLucidApp] (not db_owner/dbo) in production-like hosts.");
                }

                if (HasEffectivePermission(connection, "DELETE"))
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

    private static bool ObjectExists(SqlConnection connection, string twoPartName)
    {
        const string sql = "SELECT OBJECT_ID(@ObjectName, N'U');";

        using SqlCommand command = new(sql, connection);
        command.Parameters.Add(new SqlParameter("@ObjectName", SqlDbType.NVarChar, 256) { Value = twoPartName });

        object? scalar = command.ExecuteScalar();

        return scalar is not null and not DBNull;
    }

    private static bool RoleExists(SqlConnection connection, string roleName)
    {
        const string sql = """
                           SELECT CASE WHEN DATABASE_PRINCIPAL_ID(@RoleName) IS NULL THEN 0 ELSE 1 END;
                           """;

        using SqlCommand command = new(sql, connection);
        command.Parameters.Add(new SqlParameter("@RoleName", SqlDbType.NVarChar, 128) { Value = roleName });

        return Convert.ToInt32(command.ExecuteScalar()) == 1;
    }

    private static bool HasDenyPermission(SqlConnection connection, string granteeName, string permissionName)
    {
        const string sql = """
                           SELECT CASE WHEN EXISTS (
                               SELECT 1
                               FROM sys.database_permissions AS dp
                               INNER JOIN sys.database_principals AS gp ON dp.grantee_principal_id = gp.principal_id
                               WHERE dp.class_desc = N'OBJECT_OR_COLUMN'
                                 AND dp.major_id = OBJECT_ID(N'dbo.AuditEvents')
                                 AND dp.permission_name = @PermissionName
                                 AND dp.state_desc = N'DENY'
                                 AND gp.name = @GranteeName)
                           THEN 1 ELSE 0 END;
                           """;

        using SqlCommand command = new(sql, connection);
        command.Parameters.Add(new SqlParameter("@PermissionName", SqlDbType.NVarChar, 128) { Value = permissionName });
        command.Parameters.Add(new SqlParameter("@GranteeName", SqlDbType.NVarChar, 128) { Value = granteeName });

        return Convert.ToInt32(command.ExecuteScalar()) == 1;
    }

    private static bool HasEffectivePermission(SqlConnection connection, string permissionName)
    {
        const string sql = """
                           SELECT CASE WHEN HAS_PERMS_BY_NAME(N'dbo.AuditEvents', N'OBJECT', @PermissionName) = 1
                           THEN 1 ELSE 0 END;
                           """;

        using SqlCommand command = new(sql, connection);
        command.Parameters.Add(new SqlParameter("@PermissionName", SqlDbType.NVarChar, 128) { Value = permissionName });

        return Convert.ToInt32(command.ExecuteScalar()) == 1;
    }
}
