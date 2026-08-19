using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Kept findings plus explicit conflict rows for payload-unequal partitions.</summary>
internal sealed record FindingSnapshotMergeResult(
    IReadOnlyList<Finding> Findings,
    IReadOnlyList<FindingEngineFailure> Conflicts);
