using System.Diagnostics.CodeAnalysis;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>Compares live SQL Server metadata against curated sentinel manifests.</summary>
public static class SchemaDriftVerifier
{
    [ExcludeFromCodeCoverage(Justification = "Requires live SQL Server; covered by integration tests.")]
    public static void VerifyOrThrow(string connectionString, IReadOnlyList<SchemaSentinelExpectation> expectations)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

        if (expectations is null || expectations.Count == 0)
            throw new ArgumentException("At least one sentinel expectation is required.", nameof(expectations));

        string secured = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(connectionString);
        using SqlConnection connection = new(secured);
        connection.Open();

        IReadOnlyList<SchemaDriftMismatch> mismatches = CollectMismatches(connection, expectations);

        if (mismatches.Count == 0)
            return;

        string report = string.Join(Environment.NewLine, mismatches.Select(static m => "- " + m));
        throw new InvalidOperationException("Schema drift detected:" + Environment.NewLine + report);
    }

    [ExcludeFromCodeCoverage(Justification = "Requires live SQL Server; covered by integration tests.")]
    public static IReadOnlyList<SchemaDriftMismatch> CollectMismatches(
        SqlConnection connection,
        IReadOnlyList<SchemaSentinelExpectation> expectations)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(expectations);

        List<SchemaDriftMismatch> mismatches = [];

        foreach (SchemaSentinelExpectation expectation in expectations)
        {
            string tableName = expectation.TableName;
            string qualifiedTable = "dbo." + tableName;

            int? tableExists = connection.QuerySingleOrDefault<int?>(
                """
                SELECT 1
                FROM sys.tables t
                INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
                WHERE s.name = N'dbo' AND t.name = @TableName;
                """,
                new { TableName = tableName });

            if (tableExists is null)
            {
                mismatches.Add(new SchemaDriftMismatch
                {
                    ObjectKind = "table",
                    ObjectName = qualifiedTable,
                    Expected = "present",
                    Actual = "missing",
                });

                continue;
            }

            foreach (SchemaSentinelColumn column in expectation.Columns)
            {
                string? dataType = connection.QuerySingleOrDefault<string?>(
                    """
                    SELECT LOWER(c.DATA_TYPE)
                    FROM INFORMATION_SCHEMA.COLUMNS c
                    WHERE c.TABLE_SCHEMA = N'dbo'
                      AND c.TABLE_NAME = @TableName
                      AND c.COLUMN_NAME = @ColumnName;
                    """,
                    new { TableName = tableName, ColumnName = column.ColumnName });

                if (string.IsNullOrWhiteSpace(dataType))
                {
                    mismatches.Add(new SchemaDriftMismatch
                    {
                        ObjectKind = "column",
                        ObjectName = qualifiedTable + "." + column.ColumnName,
                        Expected = "present",
                        Actual = "missing",
                    });

                    continue;
                }

                if (!string.IsNullOrWhiteSpace(column.SqlDataType)
                    && !string.Equals(dataType, column.SqlDataType, StringComparison.OrdinalIgnoreCase))
                {
                    mismatches.Add(new SchemaDriftMismatch
                    {
                        ObjectKind = "column",
                        ObjectName = qualifiedTable + "." + column.ColumnName,
                        Expected = "type " + column.SqlDataType,
                        Actual = "type " + dataType,
                    });
                }
            }

            foreach (string indexName in expectation.IndexNames)
            {
                int? indexExists = connection.QuerySingleOrDefault<int?>(
                    """
                    SELECT 1
                    FROM sys.indexes i
                    INNER JOIN sys.tables t ON t.object_id = i.object_id
                    INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
                    WHERE s.name = N'dbo'
                      AND t.name = @TableName
                      AND i.name = @IndexName;
                    """,
                    new { TableName = tableName, IndexName = indexName });

                if (indexExists is null)
                {
                    mismatches.Add(new SchemaDriftMismatch
                    {
                        ObjectKind = "index",
                        ObjectName = qualifiedTable + "." + indexName,
                        Expected = "present",
                        Actual = "missing",
                    });
                }
            }
        }

        return mismatches;
    }
}
