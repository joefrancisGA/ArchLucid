/*
  Improvement #28 — Archive cascade TVP + dbo.Archival_CascadeFromArchivedRuns stored procedure.
*/

IF TYPE_ID(N'dbo.ArchivedRunIdList') IS NULL
    CREATE TYPE dbo.ArchivedRunIdList AS TABLE
    (
        RunId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY
    );
GO

CREATE OR ALTER PROCEDURE dbo.Archival_CascadeFromArchivedRuns
    @Archived dbo.ArchivedRunIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @cntGolden INT = 0;
    DECLARE @cntFindings INT = 0;
    DECLARE @cntContext INT = 0;
    DECLARE @cntGraph INT = 0;
    DECLARE @cntDecisioning INT = 0;
    DECLARE @cntArtifact INT = 0;
    DECLARE @cntAgentTrace INT = 0;
    DECLARE @cntComparison INT = 0;

    IF COL_LENGTH(N'dbo.GoldenManifests', N'ArchivedUtc') IS NOT NULL
    BEGIN
        UPDATE gm
        SET ArchivedUtc = SYSUTCDATETIME()
        FROM dbo.GoldenManifests AS gm
        INNER JOIN @Archived AS a ON a.RunId = gm.RunId
        WHERE gm.ArchivedUtc IS NULL;

        SET @cntGolden = @@ROWCOUNT;
    END;

    IF COL_LENGTH(N'dbo.FindingsSnapshots', N'ArchivedUtc') IS NOT NULL
    BEGIN
        UPDATE fs
        SET ArchivedUtc = SYSUTCDATETIME()
        FROM dbo.FindingsSnapshots AS fs
        INNER JOIN @Archived AS a ON a.RunId = fs.RunId
        WHERE fs.ArchivedUtc IS NULL;

        SET @cntFindings = @@ROWCOUNT;
    END;

    IF COL_LENGTH(N'dbo.ContextSnapshots', N'ArchivedUtc') IS NOT NULL
    BEGIN
        UPDATE cs
        SET ArchivedUtc = SYSUTCDATETIME()
        FROM dbo.ContextSnapshots AS cs
        INNER JOIN @Archived AS a ON a.RunId = cs.RunId
        WHERE cs.ArchivedUtc IS NULL;

        SET @cntContext = @@ROWCOUNT;
    END;

    IF COL_LENGTH(N'dbo.GraphSnapshots', N'ArchivedUtc') IS NOT NULL
    BEGIN
        UPDATE gs
        SET ArchivedUtc = SYSUTCDATETIME()
        FROM dbo.GraphSnapshots AS gs
        INNER JOIN @Archived AS a ON a.RunId = gs.RunId
        WHERE gs.ArchivedUtc IS NULL;

        SET @cntGraph = @@ROWCOUNT;
    END;

    IF COL_LENGTH(N'dbo.DecisioningTraces', N'ArchivedUtc') IS NOT NULL
    BEGIN
        UPDATE dt
        SET ArchivedUtc = SYSUTCDATETIME()
        FROM dbo.DecisioningTraces AS dt
        INNER JOIN @Archived AS a ON a.RunId = dt.RunId
        WHERE dt.ArchivedUtc IS NULL;

        SET @cntDecisioning = @@ROWCOUNT;
    END;

    IF COL_LENGTH(N'dbo.ArtifactBundles', N'ArchivedUtc') IS NOT NULL
    BEGIN
        UPDATE ab
        SET ArchivedUtc = SYSUTCDATETIME()
        FROM dbo.ArtifactBundles AS ab
        INNER JOIN @Archived AS a ON a.RunId = ab.RunId
        WHERE ab.ArchivedUtc IS NULL;

        SET @cntArtifact = @@ROWCOUNT;
    END;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ArchivedUtc') IS NOT NULL
    BEGIN
        UPDATE aet
        SET ArchivedUtc = SYSUTCDATETIME()
        FROM dbo.AgentExecutionTraces AS aet
        INNER JOIN @Archived AS a ON a.RunId = aet.RunId
        WHERE aet.ArchivedUtc IS NULL;

        SET @cntAgentTrace = @@ROWCOUNT;
    END;

    IF COL_LENGTH(N'dbo.ComparisonRecords', N'ArchivedUtc') IS NOT NULL
    BEGIN
        UPDATE cr
        SET ArchivedUtc = SYSUTCDATETIME()
        FROM dbo.ComparisonRecords AS cr
        INNER JOIN @Archived AS a ON a.RunId = cr.LeftRunId OR a.RunId = cr.RightRunId
        WHERE cr.ArchivedUtc IS NULL;

        SET @cntComparison = @@ROWCOUNT;
    END;

    SELECT
        @cntGolden AS GoldenManifests,
        @cntFindings AS FindingsSnapshots,
        @cntContext AS ContextSnapshots,
        @cntGraph AS GraphSnapshots,
        @cntDecisioning AS DecisioningTraces,
        @cntArtifact AS ArtifactBundles,
        @cntAgentTrace AS AgentExecutionTraces,
        @cntComparison AS ComparisonRecords;
END;
GO
