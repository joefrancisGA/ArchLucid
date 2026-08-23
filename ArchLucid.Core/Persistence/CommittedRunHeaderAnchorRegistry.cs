namespace ArchLucid.Core.Persistence;

/// <summary>
///     TB-310 / ADR 0045: committed run header evidence anchors on <c>dbo.Runs</c> that must not change once
///     <c>GoldenManifestId</c> is set. Lifecycle columns remain mutable.
/// </summary>
public static class CommittedRunHeaderAnchorRegistry
{
    public const string TableName = "dbo.Runs";

    public const string TriggerName = "TR_Runs_SealCommittedHeader";

    /// <summary>SQL Server user-defined error number raised by <see cref="TriggerName" />.</summary>
    public const int TriggerErrorNumber = 50310;

    /// <summary>Anchor columns frozen after commit; order matches migration 250 trigger checks.</summary>
    public static IReadOnlyList<string> AnchorColumnNames { get; } =
    [
        "RunId",
        "ProjectId",
        "TenantId",
        "WorkspaceId",
        "ScopeProjectId",
        "CreatedUtc",
        "ContextSnapshotId",
        "GraphSnapshotId",
        "FindingsSnapshotId",
        "GoldenManifestId",
        "DecisionTraceId",
        "ArtifactBundleId",
        "CurrentManifestVersion",
        "StructuralExecutionMode",
        "OtelTraceId",
        "EngineProvenanceJson",
        "GovernanceScopeJson"
    ];
}
