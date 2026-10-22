namespace ArchLucid.Api.Services.Admin;

/// <summary>Detection-only committed run header FK repoint counts (same SQL as the background probe).</summary>
public sealed record DataConsistencyHeaderRepointCounts(
    long ContextSnapshotIdRepoints,
    long GraphSnapshotIdRepoints,
    long FindingsSnapshotIdRepoints,
    long GoldenManifestIdRepoints,
    long DecisionTraceIdRepoints,
    long ArtifactBundleIdRepoints);
