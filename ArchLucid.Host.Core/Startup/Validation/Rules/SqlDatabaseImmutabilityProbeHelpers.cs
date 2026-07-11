using System.Data;
using System.Text;

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

    internal static bool TriggerExists(SqlConnection connection, string triggerName)
    {
        const string sql = "SELECT CASE WHEN OBJECT_ID(@TriggerName, N'TR') IS NULL THEN 0 ELSE 1 END;";

        using SqlCommand command = new(sql, connection);
        command.Parameters.Add(new SqlParameter("@TriggerName", SqlDbType.NVarChar, 256) { Value = triggerName });

        return Convert.ToInt32(command.ExecuteScalar()) == 1;
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

    /// <summary>
    ///     One round-trip DENY probe for many tables (avoids serial latency during sealed-evidence startup validation).
    /// </summary>
    internal static IReadOnlyList<(string TableName, string PermissionName)> CollectMissingDenyPermissions(
        SqlConnection connection,
        IReadOnlyList<string> tableTwoPartNames,
        string granteeName)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(tableTwoPartNames);
        ArgumentNullException.ThrowIfNull(granteeName);

        if (tableTwoPartNames.Count == 0)
            return [];

        string valuesClause = BuildTableValuesClause(tableTwoPartNames, out List<SqlParameter> tableParameters);

        string sql = $"""
                      SELECT t.TableName, req.PermissionName
                      FROM (VALUES {valuesClause}) AS t(TableName)
                      CROSS JOIN (
                          SELECT N'UPDATE' AS PermissionName
                          UNION ALL
                          SELECT N'DELETE') AS req
                      WHERE OBJECT_ID(t.TableName, N'U') IS NOT NULL
                        AND NOT EXISTS (
                            SELECT 1
                            FROM sys.database_permissions AS dp
                            INNER JOIN sys.database_principals AS gp ON dp.grantee_principal_id = gp.principal_id
                            WHERE dp.class_desc = N'OBJECT_OR_COLUMN'
                              AND dp.major_id = OBJECT_ID(t.TableName)
                              AND dp.permission_name = req.PermissionName
                              AND dp.state_desc = N'DENY'
                              AND gp.name = @GranteeName);
                      """;

        using SqlCommand command = new(sql, connection);
        command.Parameters.Add(new SqlParameter("@GranteeName", SqlDbType.NVarChar, 128) { Value = granteeName });

        foreach (SqlParameter parameter in tableParameters)
            command.Parameters.Add(parameter);

        return ReadTablePermissionRows(command);
    }

    /// <summary>
    ///     One round-trip effective-permission probe for many tables (connected principal must not UPDATE/DELETE sealed rows).
    /// </summary>
    internal static IReadOnlyList<(string TableName, string PermissionName)> CollectEffectivePermissionViolations(
        SqlConnection connection,
        IReadOnlyList<string> tableTwoPartNames)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(tableTwoPartNames);

        if (tableTwoPartNames.Count == 0)
            return [];

        string valuesClause = BuildTableValuesClause(tableTwoPartNames, out List<SqlParameter> tableParameters);

        string sql = $"""
                      SELECT t.TableName, req.PermissionName
                      FROM (VALUES {valuesClause}) AS t(TableName)
                      CROSS JOIN (
                          SELECT N'UPDATE' AS PermissionName
                          UNION ALL
                          SELECT N'DELETE') AS req
                      WHERE OBJECT_ID(t.TableName, N'U') IS NOT NULL
                        AND HAS_PERMS_BY_NAME(t.TableName, N'OBJECT', req.PermissionName) = 1;
                      """;

        using SqlCommand command = new(sql, connection);

        foreach (SqlParameter parameter in tableParameters)
            command.Parameters.Add(parameter);

        return ReadTablePermissionRows(command);
    }

    private static string BuildTableValuesClause(IReadOnlyList<string> tableTwoPartNames, out List<SqlParameter> tableParameters)
    {
        StringBuilder valuesClause = new();
        tableParameters = [];

        for (int index = 0; index < tableTwoPartNames.Count; index++)
        {
            if (index > 0)
                valuesClause.Append(',');

            string parameterName = $"@Table{index}";
            valuesClause.Append('(').Append(parameterName).Append(')');
            tableParameters.Add(
                new SqlParameter(parameterName, SqlDbType.NVarChar, 256) { Value = tableTwoPartNames[index] });
        }

        return valuesClause.ToString();
    }

    private static List<(string TableName, string PermissionName)> ReadTablePermissionRows(SqlCommand command)
    {
        List<(string TableName, string PermissionName)> rows = [];

        using SqlDataReader reader = command.ExecuteReader();

        while (reader.Read())
        {
            string tableName = reader.GetString(0);
            string permissionName = reader.GetString(1);
            rows.Add((tableName, permissionName));
        }

        return rows;
    }
}
