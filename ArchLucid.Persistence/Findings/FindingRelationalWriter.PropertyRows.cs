using System.Data;

using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Findings;

internal static partial class FindingRelationalWriter
{
    private static async Task InsertPropertyRowsAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingRecordId,
        FindingRelationalScope scope,
        IReadOnlyDictionary<string, string> properties,
        CancellationToken ct)
    {
        if (properties.Count == 0)
            return;

        // Ordinal key ordering keeps property row order deterministic across saves and re-reads.
        List<KeyValuePair<string, string>> orderedProps = properties
            .OrderBy(static kv => kv.Key, StringComparer.Ordinal)
            .ToList();

        DataTable rows = FindingChildTableValuedParameters.CreatePropertyTable(orderedProps);

        await ExecuteChildInsertAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.PropertiesInsert,
            rows,
            FindingChildTableValuedParameters.PropertyListTypeName,
            ct);
    }
}
