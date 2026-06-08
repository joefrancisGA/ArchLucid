using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Persistence.Coordination.Backfill;

/// <summary>Keyset pagination cursor for a backfill stage (CreatedUtc + entity key).</summary>
[ExcludeFromCodeCoverage(Justification = "Backfill cursor DTO; no logic.")]
public readonly record struct SqlRelationalBackfillCursor(DateTime LastProcessedCreatedUtc, Guid LastProcessedEntityId)
{
    // SQL Server datetime2 minimum is 1753-01-01; DateTime.MinValue overflows on checkpoint MERGE.
    public static SqlRelationalBackfillCursor Start => new(new DateTime(1753, 1, 1, 0, 0, 0, DateTimeKind.Utc), Guid.Empty);
}
