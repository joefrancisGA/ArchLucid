namespace ArchLucid.Persistence.Sql;

internal static partial class RunRepositorySql
{
    public const string Insert = """
                                 DECLARE @RunInsertOutput TABLE (RowVersionStamp VARBINARY(8) NOT NULL);

                                 INSERT INTO dbo.Runs
                                 (
                                     RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, Description, CreatedUtc,
                                     ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                                     GoldenManifestId, DecisionTraceId, ArtifactBundleId, ArchitectureId, ArchitectureVersionId, ArchivedUtc,
                                     ArchitectureRequestId, LegacyRunStatus, CompletedUtc, CurrentManifestVersion, OtelTraceId,
                                     IsDemoWelcomeRun, IsPublicShowcase, IsSample, IsPinned, RealModeFellBackToSimulator, PilotAoaiDeploymentSnapshot,
                                     StructuralExecutionMode,
                                     RetryCount, LastFailureReason, PackageOrigin, CreatedByUserId,
                                     PinnedPolicyPackIdsJson, PinnedPolicyPackIdsHashSha256,
                                     PinnedEvidencePackagePinsJson, PinnedEvidencePackagePinsHashSha256,
                                     PinnedFocusedPilotModeEnabled, PinnedFocusedPilotCloudProvider,
                                     PinnedArchitectureVersionContentHashSha256,
                                     PinnedKnowledgeModelContentHashSha256
                                 )
                                 OUTPUT inserted.RowVersionStamp INTO @RunInsertOutput
                                 VALUES
                                 (
                                     @RunId, @TenantId, @WorkspaceId, @ScopeProjectId, @ProjectId, @Description, @CreatedUtc,
                                     @ContextSnapshotId, @GraphSnapshotId, @FindingsSnapshotId,
                                     @GoldenManifestId, @DecisionTraceId, @ArtifactBundleId, @ArchitectureId, @ArchitectureVersionId, @ArchivedUtc,
                                     @ArchitectureRequestId, @LegacyRunStatus, @CompletedUtc, @CurrentManifestVersion, @OtelTraceId,
                                     @IsDemoWelcomeRun, @IsPublicShowcase, @IsSample, @IsPinned, @RealModeFellBackToSimulator, @PilotAoaiDeploymentSnapshot,
                                     @StructuralExecutionMode,
                                     @RetryCount, @LastFailureReason, @PackageOrigin, @CreatedByUserId,
                                     @PinnedPolicyPackIdsJson, @PinnedPolicyPackIdsHashSha256,
                                     @PinnedEvidencePackagePinsJson, @PinnedEvidencePackagePinsHashSha256,
                                     @PinnedFocusedPilotModeEnabled, @PinnedFocusedPilotCloudProvider,
                                     @PinnedArchitectureVersionContentHashSha256,
                                     @PinnedKnowledgeModelContentHashSha256
                                 );

                                 SELECT RowVersionStamp FROM @RunInsertOutput;
                                 """;

    public const string SelectByScopedId = $"""
                                            SELECT
                                                {RunDetailReadSql.SelectCoreColumns},
                                                PackageOrigin,
                                                {RunDetailReadSql.SelectGovernanceDispositionColumns},
                                                {RunDetailReadSql.SelectCorrelatedWarningFlags}
                                            FROM dbo.Runs
                                            WHERE RunId = @RunId
                                              AND TenantId = @TenantId
                                              AND WorkspaceId = @WorkspaceId
                                              AND ScopeProjectId = @ScopeProjectId
                                              AND ArchivedUtc IS NULL;
                                            """;

    public const string SelectByScopedIdIncludingArchived = $"""
                                                             SELECT
                                                                 {RunDetailReadSql.SelectCoreColumns},
                                                                 PackageOrigin,
                                                                 {RunDetailReadSql.SelectGovernanceDispositionColumns},
                                                                 {RunDetailReadSql.SelectCorrelatedWarningFlags}
                                                             FROM dbo.Runs
                                                             WHERE RunId = @RunId
                                                               AND TenantId = @TenantId
                                                               AND WorkspaceId = @WorkspaceId
                                                               AND ScopeProjectId = @ScopeProjectId;
                                                             """;

    public const string SelectByRunIdAdmin = $"""
                                              SELECT TOP (1)
                                                  {RunDetailReadSql.SelectCoreColumns},
                                                  {RunDetailReadSql.SelectCorrelatedWarningFlags}
                                              FROM dbo.Runs
                                              WHERE RunId = @RunId
                                                AND ArchivedUtc IS NULL;
                                              """;

    public const string SelectLatestWithGraphAtOrBefore = $"""
                                                            SELECT TOP (1)
                                                                {RunDetailReadSql.SelectCoreColumns},
                                                                {RunDetailReadSql.SelectCorrelatedWarningFlags}
                                                            FROM dbo.Runs
                                                            WHERE TenantId = @TenantId
                                                              AND WorkspaceId = @WorkspaceId
                                                              AND ScopeProjectId = @ScopeProjectId
                                                              AND UPPER(LTRIM(RTRIM(ProjectId))) = @NormalizedAuthorityProjectSlug
                                                              AND ArchivedUtc IS NULL
                                                              AND GraphSnapshotId IS NOT NULL
                                                              AND CreatedUtc <= @AsOfUtc
                                                            ORDER BY CreatedUtc DESC, RunId DESC;
                                                            """;

    public const string Update = """
                                 DECLARE @RunUpdateOutput TABLE (RowVersionStamp VARBINARY(8) NOT NULL);

                                 UPDATE dbo.Runs
                                 SET
                                     TenantId = @TenantId,
                                     WorkspaceId = @WorkspaceId,
                                     ScopeProjectId = @ScopeProjectId,
                                     ProjectId = @ProjectId,
                                     Description = @Description,
                                     ContextSnapshotId = @ContextSnapshotId,
                                     GraphSnapshotId = @GraphSnapshotId,
                                     FindingsSnapshotId = @FindingsSnapshotId,
                                     GoldenManifestId = @GoldenManifestId,
                                     DecisionTraceId = @DecisionTraceId,
                                     ArtifactBundleId = @ArtifactBundleId,
                                     ArchitectureId = @ArchitectureId,
                                     ArchitectureVersionId = @ArchitectureVersionId,
                                     ArchivedUtc = @ArchivedUtc,
                                     ArchitectureRequestId = @ArchitectureRequestId,
                                     LegacyRunStatus = @LegacyRunStatus,
                                     CompletedUtc = @CompletedUtc,
                                     CurrentManifestVersion = @CurrentManifestVersion,
                                     IsDemoWelcomeRun = @IsDemoWelcomeRun,
                                     IsPublicShowcase = @IsPublicShowcase,
                                     IsSample = @IsSample,
                                     IsPinned = @IsPinned,
                                     RealModeFellBackToSimulator = @RealModeFellBackToSimulator,
                                     PilotAoaiDeploymentSnapshot = @PilotAoaiDeploymentSnapshot,
                                     StructuralExecutionMode = @StructuralExecutionMode,
                                     RetryCount = @RetryCount,
                                     LastFailureReason = @LastFailureReason,
                                     EngineProvenanceJson = @EngineProvenanceJson,
                                     GovernanceScopeJson = @GovernanceScopeJson,
                                     AcknowledgedCoverageJson = @AcknowledgedCoverageJson,
                                     ImproveLoopEvidenceJson = @ImproveLoopEvidenceJson,
                                     KnowledgeModelId = @KnowledgeModelId,
                                     PackageOrigin = @PackageOrigin,
                                     PinnedPolicyPackIdsJson = @PinnedPolicyPackIdsJson,
                                     PinnedPolicyPackIdsHashSha256 = @PinnedPolicyPackIdsHashSha256,
                                     PinnedEvidencePackagePinsJson = @PinnedEvidencePackagePinsJson,
                                     PinnedEvidencePackagePinsHashSha256 = @PinnedEvidencePackagePinsHashSha256,
                                     PinnedFocusedPilotModeEnabled = @PinnedFocusedPilotModeEnabled,
                                     PinnedFocusedPilotCloudProvider = @PinnedFocusedPilotCloudProvider,
                                     PinnedArchitectureVersionContentHashSha256 = @PinnedArchitectureVersionContentHashSha256,
                                     PinnedKnowledgeModelContentHashSha256 = @PinnedKnowledgeModelContentHashSha256
                                 OUTPUT inserted.RowVersionStamp INTO @RunUpdateOutput
                                 WHERE RunId = @RunId
                                   AND TenantId = @TenantId
                                   AND WorkspaceId = @WorkspaceId
                                   AND ScopeProjectId = @ScopeProjectId
                                   AND (@RowVersion IS NULL OR RowVersionStamp = @RowVersion);

                                 SELECT RowVersionStamp FROM @RunUpdateOutput;
                                 """;
}
