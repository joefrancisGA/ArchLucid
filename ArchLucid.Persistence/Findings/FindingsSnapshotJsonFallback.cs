using ArchLucid.Decisioning.Findings.Serialization;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Findings;

/// <summary>Legacy <c>FindingsJson</c> hydration when <c>dbo.FindingRecords</c> is empty.</summary>
/// <remarks>TODO: remove JSON fallback after relational migration complete.</remarks>
internal static class FindingsSnapshotJsonFallback
{
    internal static FindingsSnapshot FromHeaderRow(FindingsSnapshotStorageRow row)
    {
        FindingsSnapshot snapshot = JsonEntitySerializer.Deserialize<FindingsSnapshot>(row.FindingsJson);
        snapshot.FindingsSnapshotId = row.FindingsSnapshotId;
        snapshot.RunId = row.RunId;
        snapshot.ContextSnapshotId = row.ContextSnapshotId;
        snapshot.GraphSnapshotId = row.GraphSnapshotId;
        snapshot.CreatedUtc = row.CreatedUtc;
        snapshot.SchemaVersion = row.SchemaVersion;
        FindingsSnapshotMigrator.Apply(snapshot);
        return snapshot;
    }
}
