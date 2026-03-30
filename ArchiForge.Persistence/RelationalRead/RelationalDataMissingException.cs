namespace ArchiForge.Persistence.RelationalRead;

/// <summary>
/// Thrown when <see cref="PersistenceReadMode.RequireRelational"/> is active and a
/// relational child table has no rows for a slice that should have been backfilled.
/// </summary>
public sealed class RelationalDataMissingException : InvalidOperationException
{
    public RelationalDataMissingException(
        string entityType,
        string entityId,
        string sliceName)
        : base(BuildMessage(entityType, entityId, sliceName))
    {
        EntityType = entityType;
        EntityId = entityId;
        SliceName = sliceName;
    }

    public string EntityType { get; }

    public string EntityId { get; }

    public string SliceName { get; }

    private static string BuildMessage(string entityType, string entityId, string sliceName) =>
        $"Relational data missing for {entityType} '{entityId}', slice '{sliceName}'. " +
        "PersistenceReadMode is RequireRelational. " +
        "Run SqlRelationalBackfillService or re-save the entity to populate relational child tables.";
}
