using System.Data;

using ArchLucid.Contracts.Persistence.Context;

using Dapper;

namespace ArchLucid.Persistence.ContextSnapshots;

internal static partial class ContextSnapshotRelationalRead
{
    private static async Task<List<CanonicalObject>> LoadCanonicalObjectsRelationalAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid snapshotId,
        CancellationToken ct)
    {
        const string objectsSql = """
                                  SELECT CanonicalObjectRowId, SortOrder, ObjectId, ObjectType, Name, SourceType, SourceId
                                  FROM dbo.ContextSnapshotCanonicalObjects
                                  WHERE SnapshotId = @SnapshotId
                                  ORDER BY SortOrder;
                                  """;

        List<CanonicalObjectRow> objectRows = (await connection.QueryAsync<CanonicalObjectRow>(
            new CommandDefinition(
                objectsSql,
                new { SnapshotId = snapshotId },
                transaction,
                cancellationToken: ct))).ToList();

        if (objectRows.Count == 0)
            return [];

        List<Guid> rowIds = objectRows.Select(r => r.CanonicalObjectRowId).ToList();

        const string propsSql = """
                                SELECT CanonicalObjectRowId, PropertySortOrder, PropertyKey, PropertyValue
                                FROM dbo.ContextSnapshotCanonicalObjectProperties
                                WHERE CanonicalObjectRowId IN @RowIds
                                ORDER BY CanonicalObjectRowId, PropertySortOrder;
                                """;

        List<PropertyRow> propertyRows = (await connection.QueryAsync<PropertyRow>(
            new CommandDefinition(
                propsSql,
                new { RowIds = rowIds },
                transaction,
                cancellationToken: ct))).ToList();

        Dictionary<Guid, Dictionary<string, string>> propsByObject = new();
        foreach (PropertyRow pr in propertyRows)
        {
            if (!propsByObject.TryGetValue(pr.CanonicalObjectRowId, out Dictionary<string, string>? dict))
            {
                dict = new Dictionary<string, string>(StringComparer.Ordinal);
                propsByObject[pr.CanonicalObjectRowId] = dict;
            }

            dict[pr.PropertyKey] = pr.PropertyValue;
        }

        List<CanonicalObject> result = [];
        foreach (CanonicalObjectRow r in objectRows)
        {
            propsByObject.TryGetValue(r.CanonicalObjectRowId, out Dictionary<string, string>? props);
            props ??= new Dictionary<string, string>(StringComparer.Ordinal);

            result.Add(
                new CanonicalObject
                {
                    ObjectId = r.ObjectId,
                    ObjectType = r.ObjectType,
                    Name = r.Name,
                    SourceType = r.SourceType,
                    SourceId = r.SourceId,
                    Properties = props
                });
        }

        return result;
    }

    private sealed class CanonicalObjectRow
    {
        public Guid CanonicalObjectRowId
        {
            get;
            init;
        }

        public int SortOrder
        {
            get;
            init;
        }

        public string ObjectId
        {
            get;
            init;
        } = null!;

        public string ObjectType
        {
            get;
            init;
        } = null!;

        public string Name
        {
            get;
            init;
        } = null!;

        public string SourceType
        {
            get;
            init;
        } = null!;

        public string SourceId
        {
            get;
            init;
        } = null!;
    }

    private sealed class PropertyRow
    {
        public Guid CanonicalObjectRowId
        {
            get;
            init;
        }

        public int PropertySortOrder
        {
            get;
            init;
        }

        public string PropertyKey
        {
            get;
            init;
        } = null!;

        public string PropertyValue
        {
            get;
            init;
        } = null!;
    }
}
