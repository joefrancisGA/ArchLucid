using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Payload-unequal partition: kept primary, explicit failure, and dropped alternates (DR-02).</summary>
internal sealed record FindingSnapshotMergeConflict(
    FindingEngineFailure Failure,
    string ConflictFindingId,
    IReadOnlyList<WithheldFindingSummary> Dropped);

/// <summary>Kept findings plus explicit conflict rows for payload-unequal partitions.</summary>
internal sealed record FindingSnapshotMergeResult(
    IReadOnlyList<Finding> Findings,
    IReadOnlyList<FindingSnapshotMergeConflict> Conflicts);
