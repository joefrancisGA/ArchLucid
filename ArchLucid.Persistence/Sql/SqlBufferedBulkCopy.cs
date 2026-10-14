using System.Data;
using System.Reflection;

using ArchLucid.Persistence.Configuration;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Sql;

/// <summary>Copies named row projections with bounded buffering inside the caller's transaction.</summary>
internal static class SqlBufferedBulkCopy
{
    internal const int BufferSize = 1000;

    internal static DataTable CreateTable<T>()
    {
        DataTable table = new();
        foreach (PropertyInfo property in typeof(T).GetProperties())
            table.Columns.Add(property.Name, Nullable.GetUnderlyingType(property.PropertyType) ?? property.PropertyType);
        return table;
    }

    internal static async Task WriteAsync<T>(
        SqlConnection connection,
        SqlTransaction transaction,
        string destinationTable,
        IEnumerable<T> rows,
        CancellationToken cancellationToken)
    {
        using DataTable table = CreateTable<T>();
        PropertyInfo[] properties = typeof(T).GetProperties();
        using SqlBulkCopy copy = new(connection,
            SqlBulkCopyOptions.CheckConstraints | SqlBulkCopyOptions.KeepNulls | SqlBulkCopyOptions.FireTriggers,
            transaction)
        {
            DestinationTableName = destinationTable,
            BatchSize = BufferSize,
            BulkCopyTimeout = DapperCommandTimeoutSeconds.Report,
        };
        foreach (DataColumn column in table.Columns)
            copy.ColumnMappings.Add(column.ColumnName, column.ColumnName);

        foreach (T row in rows)
        {
            cancellationToken.ThrowIfCancellationRequested();
            table.Rows.Add(properties.Select(property => property.GetValue(row) ?? DBNull.Value).ToArray());
            if (table.Rows.Count < BufferSize)
                continue;
            await copy.WriteToServerAsync(table, cancellationToken);
            table.Clear();
        }

        if (table.Rows.Count > 0)
            await copy.WriteToServerAsync(table, cancellationToken);
    }
}
