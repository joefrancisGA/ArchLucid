using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Persistence.Coordination.Backfill;

/// <summary>Keyset pagination cursor for a backfill stage (CreatedUtc + entity key).</summary>
[ExcludeFromCodeCoverage(Justification = "Backfill cursor DTO; no logic.")]
public readonly record struct SqlRelationalBackfillCursor(DateTime LastProcessedCreatedUtc, Guid LastProcessedEntityId)
{
    public static SqlRelationalBackfillCursor Start => new(DateTime.MinValue, Guid.Empty);
}
