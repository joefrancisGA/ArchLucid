namespace ArchLucid.Core.Persistence;

/// <summary>
///     TB-311 / ADR 0046: committed run header evidence pointers that must resolve to child rows owned by the same run.
///     Detection-only; complements TB-310 anchor immutability (which prevents post-commit pointer mutation).
/// </summary>
public static class CommittedRunHeaderFkRepointRegistry
{
    public const string ParentTableName = "Runs";

    /// <summary>Evidence FK pointer columns on <c>dbo.Runs</c> probed for dangling or cross-run links.</summary>
    public static IReadOnlyList<CommittedRunHeaderFkRepointRegistration> All { get; } =
    [
        new(
            "ContextSnapshotId",
            "ContextSnapshots",
            "SnapshotId",
            "RunId",
            "ContextSnapshotId"),
        new(
            "GraphSnapshotId",
            "GraphSnapshots",
            "GraphSnapshotId",
            "RunId",
            "GraphSnapshotId"),
        new(
            "FindingsSnapshotId",
            "FindingsSnapshots",
            "FindingsSnapshotId",
            "RunId",
            "FindingsSnapshotId"),
        new(
            "GoldenManifestId",
            "GoldenManifests",
            "ManifestId",
            "RunId",
            "GoldenManifestId"),
        new(
            "DecisionTraceId",
            "DecisioningTraces",
            "DecisionTraceId",
            "RunId",
            "DecisionTraceId"),
        new(
            "ArtifactBundleId",
            "ArtifactBundles",
            "BundleId",
            "RunId",
            "ArtifactBundleId"),
    ];
}
