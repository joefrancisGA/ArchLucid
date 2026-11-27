using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Support;

/// <summary>Required metadata in the migrated test catalog, including legacy names retained as synonyms.</summary>
internal static class SqlCatalogContract
{
    internal static async Task RequireColumnAsync(
        SqlConnection connection, string table, string column, CancellationToken ct, bool mustBeNotNull = false)
    {
        int objectId = await ResolveTableAsync(connection, table, ct);
        const string sql = """
                           SELECT COUNT(1)
                           FROM sys.columns
                           WHERE object_id = @ObjectId AND name = @Column
                             AND (@MustBeNotNull = 0 OR is_nullable = 0);
                           """;
        int present = await connection.QuerySingleAsync<int>(new CommandDefinition(
            sql, new { ObjectId = objectId, Column = column, MustBeNotNull = mustBeNotNull }, cancellationToken: ct));
        present.Should().Be(1, $"the migrated catalog must define {table}.{column}{(mustBeNotNull ? " as NOT NULL" : "")}");
    }

    internal static async Task RequireForeignKeyAsync(
        SqlConnection connection, string table, string foreignKey, string referencedTable, CancellationToken ct)
    {
        int parentId = await ResolveTableAsync(connection, table, ct);
        int referencedId = await ResolveTableAsync(connection, referencedTable, ct);
        const string sql = """
                           SELECT COUNT(1)
                           FROM sys.foreign_keys
                           WHERE parent_object_id = @ParentId AND referenced_object_id = @ReferencedId
                             AND name = @ForeignKey AND is_disabled = 0;
                           """;
        int present = await connection.QuerySingleAsync<int>(new CommandDefinition(
            sql, new { ParentId = parentId, ReferencedId = referencedId, ForeignKey = foreignKey }, cancellationToken: ct));
        present.Should().Be(1, $"{table} must enforce {foreignKey} to {referencedTable} in the migrated catalog");
    }

    private static async Task<int> ResolveTableAsync(SqlConnection connection, string name, CancellationToken ct)
    {
        // Object IDs are local to the current catalog. Do not resolve aliases pointing off-server or to other catalogs.
        const string sql = """
                           SELECT COALESCE(OBJECT_ID(@Name, N'U'), (
                               SELECT OBJECT_ID(s.base_object_name, N'U')
                               FROM sys.synonyms AS s
                               WHERE s.object_id = OBJECT_ID(@Name, N'SN')
                                 AND PARSENAME(s.base_object_name, 4) IS NULL
                                 AND (PARSENAME(s.base_object_name, 3) IS NULL
                                      OR PARSENAME(s.base_object_name, 3) = DB_NAME())
                           ));
                           """;
        int? objectId = await connection.QuerySingleAsync<int?>(new CommandDefinition(
            sql, new { Name = name }, cancellationToken: ct));
        return objectId ?? throw new InvalidOperationException(
            $"Expected {name} to resolve to a physical table in the migrated test catalog.");
    }
}
