using System.Data;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

internal static class SqlDatabaseImmutabilityProbeHelpers
{
    internal const string ApplicationDatabaseRoleName = "ArchLucidApp";

    internal static bool ObjectExists(SqlConnection connection, string twoPartName)
    {
        const string sql = "SELECT OBJECT_ID(@ObjectName, N'U');";

        using SqlCommand command = new(sql, connection);
        command.Parameters.Add(new SqlParameter("@ObjectName", SqlDbType.NVarChar, 256) { Value = twoPartName });

        object? scalar = command.ExecuteScalar();

        return scalar is not null and not DBNull;
    }

    internal static bool RoleExists(SqlConnection connection, string roleName)
    {
        const string sql = """
                           SELECT CASE WHEN DATABASE_PRINCIPAL_ID(@RoleName) IS NULL THEN 0 ELSE 1 END;
                           """;

        using SqlCommand command = new(sql, connection);
        command.Parameters.Add(new SqlParameter("@RoleName", SqlDbType.NVarChar, 128) { Value = roleName });

        return Convert.ToInt32(command.ExecuteScalar()) == 1;
    }

    internal static bool HasDenyPermission(SqlConnection connection, string tableTwoPartName, string granteeName, string permissionName)
    {
        const string sql = """
                           SELECT CASE WHEN EXISTS (
                               SELECT 1
                               FROM sys.database_permissions AS dp
                               INNER JOIN sys.database_principals AS gp ON dp.grantee_principal_id = gp.principal_id
                               WHERE dp.class_desc = N'OBJECT_OR_COLUMN'
                                 AND dp.major_id = OBJECT_ID(@TableName)
                                 AND dp.permission_name = @PermissionName
                                 AND dp.state_desc = N'DENY'
                                 AND gp.name = @GranteeName)
                           THEN 1 ELSE 0 END;
                           """;

        using SqlCommand command = new(sql, connection);
        command.Parameters.Add(new SqlParameter("@TableName", SqlDbType.NVarChar, 256) { Value = tableTwoPartName });
        command.Parameters.Add(new SqlParameter("@PermissionName", SqlDbType.NVarChar, 128) { Value = permissionName });
        command.Parameters.Add(new SqlParameter("@GranteeName", SqlDbType.NVarChar, 128) { Value = granteeName });

        return Convert.ToInt32(command.ExecuteScalar()) == 1;
    }

    internal static bool HasEffectivePermission(SqlConnection connection, string tableTwoPartName, string permissionName)
    {
        const string sql = """
                           SELECT CASE WHEN HAS_PERMS_BY_NAME(@TableName, N'OBJECT', @PermissionName) = 1
                           THEN 1 ELSE 0 END;
                           """;

        using SqlCommand command = new(sql, connection);
        command.Parameters.Add(new SqlParameter("@TableName", SqlDbType.NVarChar, 256) { Value = tableTwoPartName });
        command.Parameters.Add(new SqlParameter("@PermissionName", SqlDbType.NVarChar, 128) { Value = permissionName });

        return Convert.ToInt32(command.ExecuteScalar()) == 1;
    }
}
