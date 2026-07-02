namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Run dashboard list projection without <c>EngineProvenanceJson</c> (TB-585).
///     LOB column cannot be covered by <c>IX_Runs_Scope_CreatedUtc</c>; detail reads load it separately.
/// </summary>
internal static class RunListSql
{
    /// <summary>Columns for hot-path run lists; omit heavy <c>EngineProvenanceJson</c> payload.</summary>
    public const string SelectColumnsWithoutEngineProvenanceJson = """
                                                                   RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, Description, CreatedUtc,
                                                                   ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                                                                   GoldenManifestId, DecisionTraceId, ArtifactBundleId, ArchivedUtc,
                                                                   ArchitectureRequestId, LegacyRunStatus, CompletedUtc, CurrentManifestVersion, OtelTraceId,
                                                                   IsDemoWelcomeRun,
                                                                   IsPublicShowcase, IsPinned, RealModeFellBackToSimulator, PilotAoaiDeploymentSnapshot,
                                                                   StructuralExecutionMode,
                                                                   RetryCount, LastFailureReason
                                                                   """;
}
