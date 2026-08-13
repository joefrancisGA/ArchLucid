using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Reconstructs a snapshot from the <c>FindingsJson</c> blob for rows written before relational dual-write, or whose
///     relational slices were never backfilled. Header columns win over the blob because the columns are the durable
///     source of identity and timestamps.
/// </summary>
internal static class FindingsSnapshotJsonFallbackMapper
{
    public static FindingsSnapshot Map(FindingsSnapshotStorageRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (string.IsNullOrWhiteSpace(row.FindingsJson))
            return CreateHeaderOnlySnapshot(row);

        FindingsSnapshot fromJson = JsonEntitySerializer.Deserialize<FindingsSnapshot>(row.FindingsJson);
        ApplyHeaderColumns(fromJson, row);
        FindingsSnapshotListNormalizer.CoerceNullLists(fromJson);
        FindingsSnapshotMigrator.Apply(fromJson);
        FindingPayloadJsonCodec.HydrateJsonElementPayloads(fromJson.Findings);
        return fromJson;
    }

    private static FindingsSnapshot CreateHeaderOnlySnapshot(FindingsSnapshotStorageRow row) =>
        new()
        {
            FindingsSnapshotId = row.FindingsSnapshotId,
            RunId = row.RunId,
            ContextSnapshotId = row.ContextSnapshotId,
            GraphSnapshotId = row.GraphSnapshotId,
            CreatedUtc = row.CreatedUtc,
            SchemaVersion = row.SchemaVersion,
            GenerationStatus = FindingsSnapshotGenerationStatusParser.Parse(row.GenerationStatus),
            Findings = []
        };

    private static void ApplyHeaderColumns(FindingsSnapshot snapshot, FindingsSnapshotStorageRow row)
    {
        snapshot.FindingsSnapshotId = row.FindingsSnapshotId;
        snapshot.RunId = row.RunId;
        snapshot.ContextSnapshotId = row.ContextSnapshotId;
        snapshot.GraphSnapshotId = row.GraphSnapshotId;
        snapshot.CreatedUtc = row.CreatedUtc;
        snapshot.SchemaVersion = row.SchemaVersion;
    }
}
