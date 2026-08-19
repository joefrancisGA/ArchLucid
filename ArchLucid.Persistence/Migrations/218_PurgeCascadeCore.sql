/*
  Improvement #37 — shared hard-delete cascade core for purge batch procedures.
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

CREATE OR ALTER PROCEDURE dbo.SampleRunPurgeBatch
    @TenantId UNIQUEIDENTIFIER NULL,
    @CreatedBeforeUtc DATETIME2(7) NULL,
    @BatchSize INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @BatchSize < 1 OR @BatchSize > 10000
        THROW 51000, N'SampleRunPurgeBatch: @BatchSize must be between 1 and 10000.', 1;

    CREATE TABLE #PurgeRuns
    (
        RunId          UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId    UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL
    );

    INSERT INTO #PurgeRuns (RunId, TenantId, WorkspaceId, ScopeProjectId)
    SELECT TOP (@BatchSize)
           r.RunId,
           r.TenantId,
           r.WorkspaceId,
           r.ScopeProjectId
    FROM dbo.Runs AS r
    WHERE r.IsSample = 1
      AND (@TenantId IS NULL OR r.TenantId = @TenantId)
      AND (@CreatedBeforeUtc IS NULL OR r.CreatedUtc < @CreatedBeforeUtc)
    ORDER BY r.CreatedUtc ASC;

    IF NOT EXISTS (SELECT 1 FROM #PurgeRuns)
    BEGIN
        SELECT TOP (0)
               RunId,
               TenantId,
               WorkspaceId,
               ScopeProjectId
        FROM dbo.Runs;

        RETURN;
    END;

    BEGIN TRANSACTION;

    DECLARE @RunIds dbo.ArchivedRunIdList;
    INSERT INTO @RunIds (RunId)
    SELECT RunId FROM #PurgeRuns;

    EXEC dbo.PurgeCascade_Core @RunIds = @RunIds;

    DECLARE @Removed TABLE
    (
        RunId          UNIQUEIDENTIFIER NOT NULL,
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId    UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL
    );

    DELETE r
    OUTPUT deleted.RunId,
           deleted.TenantId,
           deleted.WorkspaceId,
           deleted.ScopeProjectId
    INTO @Removed
    FROM dbo.Runs AS r
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns AS p WHERE p.RunId = r.RunId);

    COMMIT TRANSACTION;

    SELECT RunId,
           TenantId,
           WorkspaceId,
           ScopeProjectId
    FROM @Removed;
END;
GO

CREATE OR ALTER PROCEDURE dbo.Archival_PurgeStaleUncommittedRunsBatch
    @CutoffUtc DATETIME2(7),
    @BatchSize INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @BatchSize < 1 OR @BatchSize > 10000
        THROW 51000, N'Archival_PurgeStaleUncommittedRunsBatch: @BatchSize must be between 1 and 10000.', 1;

    CREATE TABLE #PurgeRuns
    (
        RunId          UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId    UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL
    );

    INSERT INTO #PurgeRuns (RunId, TenantId, WorkspaceId, ScopeProjectId)
    SELECT TOP (@BatchSize)
           r.RunId,
           r.TenantId,
           r.WorkspaceId,
           r.ScopeProjectId
    FROM dbo.Runs AS r
    WHERE r.CreatedUtc < @CutoffUtc
      AND (   r.LegacyRunStatus IS NULL
           OR r.LegacyRunStatus <> N'Committed')
      AND r.IsDemoWelcomeRun = 0
      AND r.IsPublicShowcase = 0
    ORDER BY r.CreatedUtc ASC;

    IF NOT EXISTS (SELECT 1 FROM #PurgeRuns)
    BEGIN
        SELECT TOP (0)
               RunId,
               TenantId,
               WorkspaceId,
               ScopeProjectId
        FROM dbo.Runs;

        RETURN;
    END;

    BEGIN TRANSACTION;

    DECLARE @RunIds dbo.ArchivedRunIdList;
    INSERT INTO @RunIds (RunId)
    SELECT RunId FROM #PurgeRuns;

    EXEC dbo.PurgeCascade_Core @RunIds = @RunIds;

    DECLARE @Removed TABLE
    (
        RunId          UNIQUEIDENTIFIER NOT NULL,
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId    UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL
    );

    DELETE r
    OUTPUT deleted.RunId,
           deleted.TenantId,
           deleted.WorkspaceId,
           deleted.ScopeProjectId
    INTO @Removed
    FROM dbo.Runs AS r
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns AS p WHERE p.RunId = r.RunId);

    COMMIT TRANSACTION;

    SELECT RunId,
           TenantId,
           WorkspaceId,
           ScopeProjectId
    FROM @Removed;
END;
GO
