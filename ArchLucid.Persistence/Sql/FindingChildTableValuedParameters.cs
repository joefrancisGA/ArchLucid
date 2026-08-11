using System.Data;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Builds SQL Server TVPs for finding child inserts (TB-2164).
/// </summary>
internal static class FindingChildTableValuedParameters
{
    internal const string SortTextListTypeName = "dbo.FindingChildSortTextList";
    internal const string SortNodeIdListTypeName = "dbo.FindingChildSortNodeIdList";
    internal const string PropertyListTypeName = "dbo.FindingChildPropertyList";

    internal static DynamicParameters CreateScopeParameters(
        Guid findingRecordId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DataTable rows,
        string typeName)
    {
        DynamicParameters parameters = new();
        parameters.Add("FindingRecordId", findingRecordId, DbType.Guid);
        parameters.Add("TenantId", tenantId, DbType.Guid);
        parameters.Add("WorkspaceId", workspaceId, DbType.Guid);
        parameters.Add("ProjectId", projectId, DbType.Guid);
        parameters.Add("Rows", CreateStructuredParameter("Rows", typeName, rows));
        return parameters;
    }

    internal static DataTable CreateSortTextTable(IReadOnlyList<string> rows)
    {
        DataTable table = new();
        table.Columns.Add("SortOrder", typeof(int));
        table.Columns.Add("TextValue", typeof(string));

        for (int i = 0; i < rows.Count; i++)
        {
            table.Rows.Add(i, rows[i]);
        }

        return table;
    }

    internal static DataTable CreateSortNodeIdTable(IReadOnlyList<string> nodeIds)
    {
        DataTable table = new();
        table.Columns.Add("SortOrder", typeof(int));
        table.Columns.Add("NodeId", typeof(string));

        for (int i = 0; i < nodeIds.Count; i++)
        {
            table.Rows.Add(i, nodeIds[i]);
        }

        return table;
    }

    internal static DataTable CreatePropertyTable(IReadOnlyList<KeyValuePair<string, string>> orderedProps)
    {
        DataTable table = new();
        table.Columns.Add("PropertySortOrder", typeof(int));
        table.Columns.Add("PropertyKey", typeof(string));
        table.Columns.Add("PropertyValue", typeof(string));

        for (int i = 0; i < orderedProps.Count; i++)
        {
            KeyValuePair<string, string> kv = orderedProps[i];
            table.Rows.Add(i, kv.Key, kv.Value);
        }

        return table;
    }

    private static SqlParameter CreateStructuredParameter(string name, string typeName, DataTable table)
    {
        return new SqlParameter(name, SqlDbType.Structured)
        {
            TypeName = typeName,
            Value = table,
        };
    }
}
