SET NOCOUNT ON;
GO

/* R102: Rollback 102_ConfluencePublishing.sql — remove Confluence publisher tables (drops RLS predicates first). */



IF OBJECT_ID(N'dbo.ConfluencePublishJobs', N'U') IS NOT NULL
    DROP TABLE dbo.ConfluencePublishJobs;
GO

IF OBJECT_ID(N'dbo.ConfluencePublishingTargets', N'U') IS NOT NULL
    DROP TABLE dbo.ConfluencePublishingTargets;
GO
