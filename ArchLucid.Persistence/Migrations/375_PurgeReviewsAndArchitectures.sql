/*
  375: Fix PurgeCascade_Core AuditEvents.ManifestId FK gap (093) and add
  dbo.usp_ArchLucid_PurgeReviewsAndArchitectures for scoped hard-delete of reviews
  and architecture identities (operator / dev catalog cleanup).
*/

SET NOCOUNT ON;
GO

CREATE OR ALTER PROCEDURE dbo.PurgeCascade_Core
    @RunIds dbo.ArchivedRunIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ae
    SET ae.RunId = NULL
    FROM dbo.AuditEvents AS ae
    WHERE ae.RunId IS NOT NULL
      AND EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = ae.RunId);

    UPDATE ae
    SET ae.ManifestId = NULL
    FROM dbo.AuditEvents AS ae
    WHERE ae.ManifestId IS NOT NULL
      AND EXISTS (
          SELECT 1
          FROM @RunIds AS p
          INNER JOIN dbo.GoldenManifests AS gm ON gm.RunId = p.RunId
          WHERE gm.ManifestId = ae.ManifestId);

    UPDATE ct
    SET ct.RunId = NULL
    FROM dbo.ConversationThreads AS ct
    WHERE ct.RunId IS NOT NULL
      AND EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = ct.RunId);

    UPDATE ct
    SET ct.BaseRunId = NULL
    FROM dbo.ConversationThreads AS ct
    WHERE ct.BaseRunId IS NOT NULL
      AND EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = ct.BaseRunId);

    UPDATE ct
    SET ct.TargetRunId = NULL
    FROM dbo.ConversationThreads AS ct
    WHERE ct.TargetRunId IS NOT NULL
      AND EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = ct.TargetRunId);

    IF OBJECT_ID(N'dbo.ConfluencePublishJobs', N'U') IS NOT NULL
    BEGIN
        DELETE j
        FROM dbo.ConfluencePublishJobs AS j
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = j.RunId);
    END;

    DELETE ada
    FROM dbo.AlertDeliveryAttempts AS ada
    WHERE EXISTS (
        SELECT 1
        FROM dbo.AlertRecords AS ar
        WHERE ar.AlertId = ada.AlertId
          AND (   EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = ar.RunId)
               OR EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = ar.ComparedToRunId)));

    DELETE ar
    FROM dbo.AlertRecords AS ar
    WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = ar.RunId)
       OR EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = ar.ComparedToRunId);

    DELETE rr
    FROM dbo.RecommendationRecords AS rr
    WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = rr.RunId)
       OR EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = rr.ComparedToRunId);

    IF OBJECT_ID(N'dbo.IntegrationEventOutbox', N'U') IS NOT NULL
    BEGIN
        DELETE o
        FROM dbo.IntegrationEventOutbox AS o
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = o.RunId);
    END;

    IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NOT NULL
    BEGIN
        DELETE o
        FROM dbo.RetrievalIndexingOutbox AS o
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = o.RunId);
    END;

    IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
    BEGIN
        DELETE o
        FROM dbo.AuthorityPipelineWorkOutbox AS o
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = o.RunId);
    END;

    IF OBJECT_ID(N'dbo.ArchitectureRunIdempotency', N'U') IS NOT NULL
    BEGIN
        DELETE ari
        FROM dbo.ArchitectureRunIdempotency AS ari
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE TRY_CAST(ari.RunId AS UNIQUEIDENTIFIER) = p.RunId);
    END;

    IF OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NOT NULL
    BEGIN
        DELETE cri
        FROM dbo.CommitRunIdempotency AS cri
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE TRY_CAST(cri.RunId AS UNIQUEIDENTIFIER) = p.RunId);
    END;

    IF OBJECT_ID(N'dbo.AzureExtractorPackages', N'U') IS NOT NULL
    BEGIN
        DELETE x
        FROM dbo.AzureExtractorPackages AS x
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = x.RunId);
    END;

    IF OBJECT_ID(N'dbo.CloudInventoryExtractorPackages', N'U') IS NOT NULL
    BEGIN
        DELETE c
        FROM dbo.CloudInventoryExtractorPackages AS c
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = c.RunId);
    END;

    IF OBJECT_ID(N'dbo.RunStoredEvidenceFiles', N'U') IS NOT NULL
    BEGIN
        DELETE e
        FROM dbo.RunStoredEvidenceFiles AS e
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = e.RunId);
    END;

    IF OBJECT_ID(N'dbo.RunStageOutcomes', N'U') IS NOT NULL
    BEGIN
        DELETE rso
        FROM dbo.RunStageOutcomes AS rso
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = rso.RunId);
    END;

    IF OBJECT_ID(N'dbo.RunExecuteOwnershipLeases', N'U') IS NOT NULL
    BEGIN
        DELETE rol
        FROM dbo.RunExecuteOwnershipLeases AS rol
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = rol.RunId);
    END;

    DELETE et
    FROM dbo.AgentExecutionTraces AS et
    WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE TRY_CAST(et.RunId AS UNIQUEIDENTIFIER) = p.RunId);

    DELETE aru
    FROM dbo.AgentResults AS aru
    WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE TRY_CAST(aru.RunId AS UNIQUEIDENTIFIER) = p.RunId);

    DELETE t
    FROM dbo.AgentTasks AS t
    WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE TRY_CAST(t.RunId AS UNIQUEIDENTIFIER) = p.RunId);

    DELETE aep
    FROM dbo.AgentEvidencePackages AS aep
    WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE TRY_CAST(aep.RunId AS UNIQUEIDENTIFIER) = p.RunId);

    IF OBJECT_ID(N'dbo.DecisionTraces', N'U') IS NOT NULL
    BEGIN
        DELETE dt
        FROM dbo.DecisionTraces AS dt
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE TRY_CAST(dt.RunId AS UNIQUEIDENTIFIER) = p.RunId);
    END;

    IF OBJECT_ID(N'dbo.ProductLearningImprovementPlanArchitectureRuns', N'U') IS NOT NULL
    BEGIN
        DELETE plr
        FROM dbo.ProductLearningImprovementPlanArchitectureRuns AS plr
        WHERE EXISTS (
            SELECT 1 FROM @RunIds AS p WHERE TRY_CAST(plr.ArchitectureRunId AS UNIQUEIDENTIFIER) = p.RunId);
    END;

    IF OBJECT_ID(N'dbo.EvolutionSimulationRuns', N'U') IS NOT NULL
    BEGIN
        DELETE esr
        FROM dbo.EvolutionSimulationRuns AS esr
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE TRY_CAST(esr.BaselineArchitectureRunId AS UNIQUEIDENTIFIER) = p.RunId);
    END;

    IF OBJECT_ID(N'dbo.ArchitectureDiagramModels', N'U') IS NOT NULL
    BEGIN
        DELETE m
        FROM dbo.ArchitectureDiagramModels AS m
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = m.RunId);
    END;

    IF OBJECT_ID(N'dbo.ArchitectureDiagramReconciliations', N'U') IS NOT NULL
    BEGIN
        DELETE rc
        FROM dbo.ArchitectureDiagramReconciliations AS rc
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = rc.RunId);
    END;

    IF OBJECT_ID(N'dbo.RunScopedLlmBudgetReservations', N'U') IS NOT NULL
    BEGIN
        DELETE b
        FROM dbo.RunScopedLlmBudgetReservations AS b
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE TRY_CAST(b.RunId AS UNIQUEIDENTIFIER) = p.RunId);
    END;

    IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
    BEGIN
        DELETE fre
        FROM dbo.FindingReviewEvents AS fre
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE fre.RunId = p.RunId);
    END;

    IF OBJECT_ID(N'dbo.RiskExceptions', N'U') IS NOT NULL
    BEGIN
        DELETE re
        FROM dbo.RiskExceptions AS re
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE re.RunId = p.RunId);
    END;

    IF OBJECT_ID(N'dbo.AuditArchitectureEvidenceLinks', N'U') IS NOT NULL
    BEGIN
        DELETE ael
        FROM dbo.AuditArchitectureEvidenceLinks AS ael
        WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE ael.RunId = p.RunId);
    END;

    DELETE ps
    FROM dbo.ProvenanceSnapshots AS ps
    WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = ps.RunId);

    DELETE cr
    FROM dbo.ComparisonRecords AS cr
    WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = cr.LeftRunId)
       OR EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = cr.RightRunId);

    DELETE ab
    FROM dbo.ArtifactBundles AS ab
    WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = ab.RunId);

    DELETE gm
    FROM dbo.GoldenManifests AS gm
    WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = gm.RunId);

    DELETE fs
    FROM dbo.FindingsSnapshots AS fs
    WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = fs.RunId);

    DELETE gs
    FROM dbo.GraphSnapshots AS gs
    WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = gs.RunId);

    DELETE cs
    FROM dbo.ContextSnapshots AS cs
    WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = cs.RunId);

    DELETE dtr
    FROM dbo.DecisioningTraces AS dtr
    WHERE EXISTS (SELECT 1 FROM @RunIds AS p WHERE p.RunId = dtr.RunId);
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
BEGIN
    GRANT EXECUTE ON OBJECT::dbo.PurgeCascade_Core TO [ArchLucidApp];
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_ArchLucid_PurgeReviewsAndArchitectures
    @TenantId        UNIQUEIDENTIFIER,
    @WorkspaceId     UNIQUEIDENTIFIER = NULL,
    @ScopeProjectId  UNIQUEIDENTIFIER = NULL,
    @IncludeDemoRuns BIT = 1,
    @DeleteDrafts    BIT = 1,
    @BatchSize       INT = 500,
    @DryRun          BIT = 0,
    @Confirm         NVARCHAR(32) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Confirm <> N'DELETE'
        THROW 51000, N'Confirmation required: pass @Confirm = N''DELETE''.', 1;

    IF @BatchSize < 1 OR @BatchSize > 10000
        THROW 51000, N'@BatchSize must be between 1 and 10000.', 1;

    IF OBJECT_ID(N'dbo.PurgeCascade_Core', N'P') IS NULL
        THROW 51000, N'dbo.PurgeCascade_Core is missing.', 1;

    DECLARE @ReviewsDeleted       INT = 0;
    DECLARE @ArchitecturesDeleted INT = 0;
    DECLARE @DraftsDeleted        INT = 0;
    DECLARE @RecurrenceDeleted    INT = 0;
    DECLARE @ImportsDeleted       INT = 0;

    IF @DryRun = 1
    BEGIN
        SELECT
            (SELECT COUNT(*)
             FROM dbo.Runs AS r
             WHERE r.TenantId = @TenantId
               AND (@WorkspaceId IS NULL OR r.WorkspaceId = @WorkspaceId)
               AND (@ScopeProjectId IS NULL OR r.ScopeProjectId = @ScopeProjectId)
               AND (@IncludeDemoRuns = 1 OR (r.IsDemoWelcomeRun = 0 AND r.IsPublicShowcase = 0))
            ) AS ReviewsToDelete,
            (SELECT COUNT(*)
             FROM dbo.Architectures AS a
             WHERE a.TenantId = @TenantId
               AND (@WorkspaceId IS NULL OR a.WorkspaceId = @WorkspaceId)
               AND (@ScopeProjectId IS NULL OR a.ScopeProjectId = @ScopeProjectId)
            ) AS ArchitecturesToDelete,
            (SELECT COUNT(*)
             FROM dbo.ArchitectureVersions AS av
             INNER JOIN dbo.Architectures AS a ON a.ArchitectureId = av.ArchitectureId
             WHERE a.TenantId = @TenantId
               AND (@WorkspaceId IS NULL OR a.WorkspaceId = @WorkspaceId)
               AND (@ScopeProjectId IS NULL OR a.ScopeProjectId = @ScopeProjectId)
            ) AS ArchitectureVersionsToDelete,
            CASE WHEN @DeleteDrafts = 1 THEN
                (SELECT COUNT(*)
                 FROM dbo.DraftRequests AS d
                 WHERE d.TenantId = @TenantId
                   AND (@WorkspaceId IS NULL OR d.WorkspaceId = @WorkspaceId)
                   AND (@ScopeProjectId IS NULL OR d.ProjectId = @ScopeProjectId)
                )
            ELSE 0 END AS DraftsToDelete,
            (SELECT COUNT(*)
             FROM dbo.ArchitectureReviewRecurrenceSchedules AS s
             WHERE s.TenantId = @TenantId
               AND (@WorkspaceId IS NULL OR s.WorkspaceId = @WorkspaceId)
               AND (@ScopeProjectId IS NULL OR s.ProjectId = @ScopeProjectId)
            ) AS RecurrenceSchedulesToDelete,
            (SELECT COUNT(*)
             FROM dbo.ImportedArchitectureRequests AS i
             WHERE i.TenantId = @TenantId
               AND (@WorkspaceId IS NULL OR i.WorkspaceId = @WorkspaceId)
               AND (@ScopeProjectId IS NULL OR i.ProjectId = @ScopeProjectId)
            ) AS ImportedRequestsToDelete;

        RETURN;
    END;

    WHILE 1 = 1
    BEGIN
        CREATE TABLE #BatchRuns (RunId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY);

        INSERT INTO #BatchRuns (RunId)
        SELECT TOP (@BatchSize) r.RunId
        FROM dbo.Runs AS r
        WHERE r.TenantId = @TenantId
          AND (@WorkspaceId IS NULL OR r.WorkspaceId = @WorkspaceId)
          AND (@ScopeProjectId IS NULL OR r.ScopeProjectId = @ScopeProjectId)
          AND (@IncludeDemoRuns = 1 OR (r.IsDemoWelcomeRun = 0 AND r.IsPublicShowcase = 0))
        ORDER BY r.CreatedUtc ASC;

        IF NOT EXISTS (SELECT 1 FROM #BatchRuns)
        BEGIN
            DROP TABLE #BatchRuns;
            BREAK;
        END;

        BEGIN TRANSACTION;

        DECLARE @RunIds dbo.ArchivedRunIdList;
        INSERT INTO @RunIds (RunId) SELECT RunId FROM #BatchRuns;

        EXEC dbo.PurgeCascade_Core @RunIds = @RunIds;

        DELETE r
        FROM dbo.Runs AS r
        WHERE EXISTS (SELECT 1 FROM #BatchRuns AS b WHERE b.RunId = r.RunId);

        SET @ReviewsDeleted += @@ROWCOUNT;

        COMMIT TRANSACTION;
        DROP TABLE #BatchRuns;
    END;

    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules', N'U') IS NOT NULL
    BEGIN
        DELETE s
        FROM dbo.ArchitectureReviewRecurrenceSchedules AS s
        WHERE s.TenantId = @TenantId
          AND (@WorkspaceId IS NULL OR s.WorkspaceId = @WorkspaceId)
          AND (@ScopeProjectId IS NULL OR s.ProjectId = @ScopeProjectId);

        SET @RecurrenceDeleted = @@ROWCOUNT;
    END;

    IF @DeleteDrafts = 1 AND OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
    BEGIN
        DELETE d
        FROM dbo.DraftRequests AS d
        WHERE d.TenantId = @TenantId
          AND (@WorkspaceId IS NULL OR d.WorkspaceId = @WorkspaceId)
          AND (@ScopeProjectId IS NULL OR d.ProjectId = @ScopeProjectId);

        SET @DraftsDeleted = @@ROWCOUNT;
    END;

    IF OBJECT_ID(N'dbo.ImportedArchitectureRequests', N'U') IS NOT NULL
    BEGIN
        DELETE i
        FROM dbo.ImportedArchitectureRequests AS i
        WHERE i.TenantId = @TenantId
          AND (@WorkspaceId IS NULL OR i.WorkspaceId = @WorkspaceId)
          AND (@ScopeProjectId IS NULL OR i.ProjectId = @ScopeProjectId);

        SET @ImportsDeleted = @@ROWCOUNT;
    END;

    IF OBJECT_ID(N'dbo.ArchitectureVersions', N'U') IS NOT NULL
    BEGIN
        DELETE av
        FROM dbo.ArchitectureVersions AS av
        INNER JOIN dbo.Architectures AS a ON a.ArchitectureId = av.ArchitectureId
        WHERE a.TenantId = @TenantId
          AND (@WorkspaceId IS NULL OR a.WorkspaceId = @WorkspaceId)
          AND (@ScopeProjectId IS NULL OR a.ScopeProjectId = @ScopeProjectId);
    END;

    DELETE a
    FROM dbo.Architectures AS a
    WHERE a.TenantId = @TenantId
      AND (@WorkspaceId IS NULL OR a.WorkspaceId = @WorkspaceId)
      AND (@ScopeProjectId IS NULL OR a.ScopeProjectId = @ScopeProjectId);

    SET @ArchitecturesDeleted = @@ROWCOUNT;

    COMMIT TRANSACTION;

    SELECT
        @ReviewsDeleted       AS ReviewsDeleted,
        @ArchitecturesDeleted AS ArchitecturesDeleted,
        @DraftsDeleted        AS DraftsDeleted,
        @RecurrenceDeleted    AS RecurrenceSchedulesDeleted,
        @ImportsDeleted       AS ImportedRequestsDeleted;
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
BEGIN
    GRANT EXECUTE ON OBJECT::dbo.usp_ArchLucid_PurgeReviewsAndArchitectures TO [ArchLucidApp];
END;
GO
