namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Shared <c>dbo.Runs</c> detail-read column projections for scoped and admin lookups.
/// </summary>
internal static class RunDetailReadSql
{
    /// <summary>Core run header columns including <c>EngineProvenanceJson</c> and row version.</summary>
    public const string SelectCoreColumns = """
                                            RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, Description, CreatedUtc,
                                            ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                                            GoldenManifestId, DecisionTraceId, ArtifactBundleId, ArchivedUtc,
                                            ArchitectureRequestId, LegacyRunStatus, CompletedUtc, CurrentManifestVersion, OtelTraceId,
                                            IsDemoWelcomeRun, IsPublicShowcase, IsSample, IsPinned, RealModeFellBackToSimulator, PilotAoaiDeploymentSnapshot,
                                            StructuralExecutionMode,
                                            RetryCount, LastFailureReason, EngineProvenanceJson, GovernanceScopeJson,
                                            RowVersionStamp AS RowVersion
                                            """;

    /// <summary>Per-row correlated warning flags (detail reads; list paths use join aggregates).</summary>
    public const string SelectCorrelatedWarningFlags = """
                                                       CASE WHEN EXISTS (SELECT 1 FROM dbo.FindingsSnapshots fs WITH (NOLOCK) WHERE fs.RunId = dbo.Runs.RunId AND fs.ArchivedUtc IS NULL AND fs.HasWarnings = 1) THEN 1 ELSE 0 END AS HasWarnings,
                                                       CASE WHEN EXISTS (SELECT 1 FROM dbo.AlertRecords ar WITH (NOLOCK) WHERE ar.RunId = dbo.Runs.RunId AND ar.Status = 'Open') THEN 1 ELSE 0 END AS HasGovernanceWarnings
                                                       """;

    public const string SelectGovernanceDispositionColumns = """
                                                             OperatorGovernanceDecision, OperatorGovernanceDecisionRationale,
                                                             OperatorGovernanceDecisionUtc, OperatorGovernanceDecisionByUserId
                                                             """;

    /// <summary>Subset loaded before committed-run anchor guard checks.</summary>
    public const string SelectAnchorGuardColumns = """
                                                   RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, CreatedUtc,
                                                   ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                                                   GoldenManifestId, DecisionTraceId, ArtifactBundleId,
                                                   CurrentManifestVersion, OtelTraceId, StructuralExecutionMode,
                                                   EngineProvenanceJson, GovernanceScopeJson
                                                   """;
}
