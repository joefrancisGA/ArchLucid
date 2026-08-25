namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Command and detail-read SQL for <c>SqlRunRepository</c> outside hot-path list shapes.
/// </summary>
internal static class RunRepositorySql
{
    public const string Insert = """
                                 DECLARE @RunInsertOutput TABLE (RowVersionStamp VARBINARY(8) NOT NULL);

                                 INSERT INTO dbo.Runs
                                 (
                                     RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, Description, CreatedUtc,
                                     ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                                     GoldenManifestId, DecisionTraceId, ArtifactBundleId, ArchitectureId, ArchivedUtc,
                                     ArchitectureRequestId, LegacyRunStatus, CompletedUtc, CurrentManifestVersion, OtelTraceId,
                                     IsDemoWelcomeRun, IsPublicShowcase, IsSample, IsPinned, RealModeFellBackToSimulator, PilotAoaiDeploymentSnapshot,
                                     StructuralExecutionMode,
                                     RetryCount, LastFailureReason, PackageOrigin
                                 )
                                 OUTPUT inserted.RowVersionStamp INTO @RunInsertOutput
                                 VALUES
                                 (
                                     @RunId, @TenantId, @WorkspaceId, @ScopeProjectId, @ProjectId, @Description, @CreatedUtc,
                                     @ContextSnapshotId, @GraphSnapshotId, @FindingsSnapshotId,
                                     @GoldenManifestId, @DecisionTraceId, @ArtifactBundleId, @ArchitectureId, @ArchivedUtc,
                                     @ArchitectureRequestId, @LegacyRunStatus, @CompletedUtc, @CurrentManifestVersion, @OtelTraceId,
                                     @IsDemoWelcomeRun, @IsPublicShowcase, @IsSample, @IsPinned, @RealModeFellBackToSimulator, @PilotAoaiDeploymentSnapshot,
                                     @StructuralExecutionMode,
                                     @RetryCount, @LastFailureReason, @PackageOrigin
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

    public const string SelectLatestCommittedRunIdByManifestCreatedUtc = """
                                                                         SELECT TOP (1) r.RunId
                                                                         FROM dbo.Runs r WITH (NOLOCK)
                                                                         INNER JOIN dbo.GoldenManifests gm WITH (NOLOCK)
                                                                             ON gm.ManifestId = r.GoldenManifestId
                                                                         WHERE r.TenantId = @TenantId
                                                                           AND r.WorkspaceId = @WorkspaceId
                                                                           AND r.ScopeProjectId = @ScopeProjectId
                                                                           AND UPPER(LTRIM(RTRIM(r.ProjectId))) = @NormalizedAuthorityProjectSlug
                                                                           AND r.ArchivedUtc IS NULL
                                                                           AND gm.ArchivedUtc IS NULL
                                                                           AND (
                                                                                r.LegacyRunStatus = @CommittedStatus
                                                                                OR NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL
                                                                                OR r.GoldenManifestId IS NOT NULL
                                                                           )
                                                                         ORDER BY gm.CreatedUtc DESC, r.RunId DESC;
                                                                         """;

    public const string SelectPriorCommittedRunIdBeforeCurrent = """
                                                                 SELECT TOP (1) r.RunId
                                                                 FROM dbo.Runs r WITH (NOLOCK)
                                                                 INNER JOIN dbo.GoldenManifests gm WITH (NOLOCK)
                                                                     ON gm.ManifestId = r.GoldenManifestId
                                                                 WHERE r.TenantId = @TenantId
                                                                   AND r.WorkspaceId = @WorkspaceId
                                                                   AND r.ScopeProjectId = @ScopeProjectId
                                                                   AND UPPER(LTRIM(RTRIM(r.ProjectId))) = @NormalizedAuthorityProjectSlug
                                                                   AND r.ArchivedUtc IS NULL
                                                                   AND gm.ArchivedUtc IS NULL
                                                                   AND r.RunId <> @CurrentRunId
                                                                   AND (
                                                                        r.CreatedUtc < @CurrentCreatedUtc
                                                                        OR (r.CreatedUtc = @CurrentCreatedUtc AND r.RunId < @CurrentRunId)
                                                                   )
                                                                   AND (
                                                                        r.LegacyRunStatus = @CommittedStatus
                                                                        OR NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL
                                                                        OR r.GoldenManifestId IS NOT NULL
                                                                   )
                                                                 ORDER BY r.CreatedUtc DESC, r.RunId DESC;
                                                                 """;

    public const string SelectPriorCommittedRunIdForArchitectureBeforeCurrent = """
                                                                 SELECT TOP (1) r.RunId
                                                                 FROM dbo.Runs r WITH (NOLOCK)
                                                                 INNER JOIN dbo.GoldenManifests gm WITH (NOLOCK)
                                                                     ON gm.ManifestId = r.GoldenManifestId
                                                                 WHERE r.TenantId = @TenantId
                                                                   AND r.WorkspaceId = @WorkspaceId
                                                                   AND r.ScopeProjectId = @ScopeProjectId
                                                                   AND r.ArchitectureId = @ArchitectureId
                                                                   AND r.ArchivedUtc IS NULL
                                                                   AND gm.ArchivedUtc IS NULL
                                                                   AND r.RunId <> @CurrentRunId
                                                                   AND (
                                                                        r.CreatedUtc < @CurrentCreatedUtc
                                                                        OR (r.CreatedUtc = @CurrentCreatedUtc AND r.RunId < @CurrentRunId)
                                                                   )
                                                                   AND (
                                                                        r.LegacyRunStatus = @CommittedStatus
                                                                        OR NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL
                                                                        OR r.GoldenManifestId IS NOT NULL
                                                                   )
                                                                 ORDER BY r.CreatedUtc DESC, r.RunId DESC;
                                                                 """;

    public const string SelectCommittedRunIdByGoldenManifestId = """
                                                                 SELECT TOP (1) r.RunId
                                                                 FROM dbo.Runs r WITH (NOLOCK)
                                                                 WHERE r.TenantId = @TenantId
                                                                   AND r.WorkspaceId = @WorkspaceId
                                                                   AND r.ScopeProjectId = @ScopeProjectId
                                                                   AND r.ArchitectureId = @ArchitectureId
                                                                   AND r.GoldenManifestId = @GoldenManifestId
                                                                   AND r.ArchivedUtc IS NULL
                                                                   AND r.RunId <> @ExcludeRunId
                                                                   AND (
                                                                        r.LegacyRunStatus = @CommittedStatus
                                                                        OR NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL
                                                                        OR r.GoldenManifestId IS NOT NULL
                                                                   )
                                                                 ORDER BY r.CreatedUtc DESC, r.RunId DESC;
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
                                     ImproveLoopEvidenceJson = @ImproveLoopEvidenceJson,
                                     KnowledgeModelId = @KnowledgeModelId,
                                     PackageOrigin = @PackageOrigin
                                 OUTPUT inserted.RowVersionStamp INTO @RunUpdateOutput
                                 WHERE RunId = @RunId
                                   AND TenantId = @TenantId
                                   AND WorkspaceId = @WorkspaceId
                                   AND ScopeProjectId = @ScopeProjectId
                                   AND (@RowVersion IS NULL OR RowVersionStamp = @RowVersion);

                                 SELECT RowVersionStamp FROM @RunUpdateOutput;
                                 """;

    public const string ArchiveRunsCreatedBefore = """
                                                   DECLARE @ArchivedScratch TABLE (
                                                       RunId UNIQUEIDENTIFIER NOT NULL,
                                                       TenantId UNIQUEIDENTIFIER NOT NULL,
                                                       WorkspaceId UNIQUEIDENTIFIER NOT NULL,
                                                       ScopeProjectId UNIQUEIDENTIFIER NOT NULL
                                                   );

                                                   DECLARE @Archived dbo.ArchivedRunIdList;

                                                   UPDATE dbo.Runs
                                                   SET ArchivedUtc = SYSUTCDATETIME()
                                                   OUTPUT inserted.RunId, inserted.TenantId, inserted.WorkspaceId, inserted.ScopeProjectId
                                                   INTO @ArchivedScratch
                                                   WHERE ArchivedUtc IS NULL AND CreatedUtc < @Cutoff;

                                                   INSERT INTO @Archived (RunId)
                                                   SELECT RunId FROM @ArchivedScratch;

                                                   SELECT RunId, TenantId, WorkspaceId, ScopeProjectId FROM @ArchivedScratch;

                                                   EXEC dbo.Archival_CascadeFromArchivedRuns @Archived = @Archived;
                                                   """;

    public const string ArchiveRunsCreatedBeforeInScope = """
                                                            DECLARE @ArchivedScratch TABLE (
                                                                RunId UNIQUEIDENTIFIER NOT NULL,
                                                                TenantId UNIQUEIDENTIFIER NOT NULL,
                                                                WorkspaceId UNIQUEIDENTIFIER NOT NULL,
                                                                ScopeProjectId UNIQUEIDENTIFIER NOT NULL
                                                            );

                                                            DECLARE @Archived dbo.ArchivedRunIdList;

                                                            UPDATE dbo.Runs
                                                            SET ArchivedUtc = SYSUTCDATETIME()
                                                            OUTPUT inserted.RunId, inserted.TenantId, inserted.WorkspaceId, inserted.ScopeProjectId
                                                            INTO @ArchivedScratch
                                                            WHERE ArchivedUtc IS NULL
                                                              AND CreatedUtc < @Cutoff
                                                              AND TenantId = @TenantId
                                                              AND WorkspaceId = @WorkspaceId
                                                              AND ScopeProjectId = @ScopeProjectId;

                                                            INSERT INTO @Archived (RunId)
                                                            SELECT RunId FROM @ArchivedScratch;

                                                            SELECT RunId, TenantId, WorkspaceId, ScopeProjectId FROM @ArchivedScratch;

                                                            EXEC dbo.Archival_CascadeFromArchivedRuns @Archived = @Archived;
                                                            """;

    public const string ArchiveRunsByIds = """
                                           DECLARE @ArchivedScratch TABLE (
                                               RunId UNIQUEIDENTIFIER NOT NULL,
                                               TenantId UNIQUEIDENTIFIER NOT NULL,
                                               WorkspaceId UNIQUEIDENTIFIER NOT NULL,
                                               ScopeProjectId UNIQUEIDENTIFIER NOT NULL
                                           );

                                           DECLARE @Archived dbo.ArchivedRunIdList;

                                           UPDATE dbo.Runs
                                           SET ArchivedUtc = SYSUTCDATETIME()
                                           OUTPUT inserted.RunId, inserted.TenantId, inserted.WorkspaceId, inserted.ScopeProjectId
                                           INTO @ArchivedScratch
                                           WHERE RunId IN @RunIds AND ArchivedUtc IS NULL;

                                           INSERT INTO @Archived (RunId)
                                           SELECT RunId FROM @ArchivedScratch;

                                           SELECT RunId, TenantId, WorkspaceId, ScopeProjectId FROM @ArchivedScratch;

                                           SELECT RunId
                                           FROM dbo.Runs
                                           WHERE RunId IN @RunIds AND ArchivedUtc IS NOT NULL;

                                           EXEC dbo.Archival_CascadeFromArchivedRuns @Archived = @Archived;
                                           """;

    public const string CountActiveRunsForArchitectureRequest = """
                                                                SELECT COUNT(1)
                                                                FROM dbo.Runs
                                                                WHERE TenantId = @TenantId
                                                                  AND WorkspaceId = @WorkspaceId
                                                                  AND ScopeProjectId = @ScopeProjectId
                                                                  AND ArchitectureRequestId = @ArchitectureRequestId
                                                                  AND ArchivedUtc IS NULL
                                                                  AND (
                                                                      LegacyRunStatus IS NULL
                                                                      OR LegacyRunStatus NOT IN (@CommittedStatus, @FailedStatus, @QualityRejectedStatus));
                                                                """;

    public const string ExistsRunForArchitectureRequestInScope = """
                                                                 SELECT CASE
                                                                     WHEN EXISTS (
                                                                         SELECT 1
                                                                         FROM dbo.Runs
                                                                         WHERE TenantId = @TenantId
                                                                           AND WorkspaceId = @WorkspaceId
                                                                           AND ScopeProjectId = @ScopeProjectId
                                                                           AND ArchitectureRequestId = @ArchitectureRequestId
                                                                     ) THEN 1
                                                                     ELSE 0
                                                                 END;
                                                                 """;

    public const string ExistsActiveRunWithSystemNameInWorkspace = """
                                                                   SELECT CASE
                                                                       WHEN EXISTS (
                                                                           SELECT 1
                                                                           FROM dbo.Runs
                                                                           WHERE TenantId = @TenantId
                                                                             AND WorkspaceId = @WorkspaceId
                                                                             AND ArchivedUtc IS NULL
                                                                             AND UPPER(LTRIM(RTRIM(ProjectId))) = @NormalizedSystemName
                                                                       ) THEN 1
                                                                       ELSE 0
                                                                   END;
                                                                   """;

    public const string SelectAnchorGuardByScopedId = $"""
                                                       SELECT
                                                           {RunDetailReadSql.SelectAnchorGuardColumns}
                                                       FROM dbo.Runs
                                                       WHERE RunId = @RunId
                                                         AND TenantId = @TenantId
                                                         AND WorkspaceId = @WorkspaceId
                                                         AND ScopeProjectId = @ScopeProjectId;
                                                       """;

    public const string UpdateOperatorGovernanceDisposition = """
                                                              UPDATE dbo.Runs
                                                              SET OperatorGovernanceDecision = @Decision,
                                                                  OperatorGovernanceDecisionRationale = @Rationale,
                                                                  OperatorGovernanceDecisionUtc = @OccurredUtc,
                                                                  OperatorGovernanceDecisionByUserId = @ActorUserId
                                                              WHERE RunId = @RunId
                                                                AND TenantId = @TenantId
                                                                AND WorkspaceId = @WorkspaceId
                                                                AND ScopeProjectId = @ScopeProjectId
                                                                AND ArchivedUtc IS NULL;
                                                              """;
}
