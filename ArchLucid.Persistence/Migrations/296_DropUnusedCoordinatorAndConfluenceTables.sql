/*
  Migration 296: Drop unused coordinator DecisionTraces + unwired Confluence SQL tables.

  - dbo.DecisionTraces: coordinator-era event stream; authority writes dbo.DecisioningTraces only.
  - dbo.ConfluencePublishJobs / dbo.ConfluencePublishingTargets: created in 102 but never wired;
    Confluence publish is config + HTTP only.

  Idempotent: DROP only when present. Drop jobs before targets (FK).
  Note: 295 is ADR 0064 buyer-vocabulary spine rename — do not reuse that prefix.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.ConfluencePublishJobs', N'U') IS NOT NULL
    DROP TABLE dbo.ConfluencePublishJobs;
GO

IF OBJECT_ID(N'dbo.ConfluencePublishingTargets', N'U') IS NOT NULL
    DROP TABLE dbo.ConfluencePublishingTargets;
GO

IF OBJECT_ID(N'dbo.DecisionTraces', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DecisionTraces_Runs_RunId')
        ALTER TABLE dbo.DecisionTraces DROP CONSTRAINT FK_DecisionTraces_Runs_RunId;

    DROP TABLE dbo.DecisionTraces;
END
GO
