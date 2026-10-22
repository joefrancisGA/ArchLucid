/*
  Improvement #29 — WITH CHECK validate the 14 core execution-chain FK constraints.

  No schema rollback: trusted FKs cannot be "un-trusted" by script; brownfield repair only.
  Prerequisite: no orphaned rows in the parent-child chain (DataConsistencyOrphanProbe).
*/

SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ContextSnapshots_Runs_RunId' AND is_not_trusted = 1)
    ALTER TABLE dbo.ContextSnapshots WITH CHECK CHECK CONSTRAINT FK_ContextSnapshots_Runs_RunId;
GO

IF OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GraphSnapshots_Runs_RunId' AND is_not_trusted = 1)
    ALTER TABLE dbo.GraphSnapshots WITH CHECK CHECK CONSTRAINT FK_GraphSnapshots_Runs_RunId;
GO

IF OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GraphSnapshots_ContextSnapshots_ContextSnapshotId' AND is_not_trusted = 1)
    ALTER TABLE dbo.GraphSnapshots WITH CHECK CHECK CONSTRAINT FK_GraphSnapshots_ContextSnapshots_ContextSnapshotId;
GO

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_Runs_RunId' AND is_not_trusted = 1)
    ALTER TABLE dbo.FindingsSnapshots WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_Runs_RunId;
GO

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId' AND is_not_trusted = 1)
    ALTER TABLE dbo.FindingsSnapshots WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId;
GO

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_GraphSnapshots_GraphSnapshotId' AND is_not_trusted = 1)
    ALTER TABLE dbo.FindingsSnapshots WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_GraphSnapshots_GraphSnapshotId;
GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DecisioningTraces_Runs_RunId' AND is_not_trusted = 1)
    ALTER TABLE dbo.DecisioningTraces WITH CHECK CHECK CONSTRAINT FK_DecisioningTraces_Runs_RunId;
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_Runs_RunId' AND is_not_trusted = 1)
    ALTER TABLE dbo.GoldenManifests WITH CHECK CHECK CONSTRAINT FK_GoldenManifests_Runs_RunId;
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_ContextSnapshots_ContextSnapshotId' AND is_not_trusted = 1)
    ALTER TABLE dbo.GoldenManifests WITH CHECK CHECK CONSTRAINT FK_GoldenManifests_ContextSnapshots_ContextSnapshotId;
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_GraphSnapshots_GraphSnapshotId' AND is_not_trusted = 1)
    ALTER TABLE dbo.GoldenManifests WITH CHECK CHECK CONSTRAINT FK_GoldenManifests_GraphSnapshots_GraphSnapshotId;
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_FindingsSnapshots_FindingsSnapshotId' AND is_not_trusted = 1)
    ALTER TABLE dbo.GoldenManifests WITH CHECK CHECK CONSTRAINT FK_GoldenManifests_FindingsSnapshots_FindingsSnapshotId;
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_DecisioningTraces_DecisionTraceId' AND is_not_trusted = 1)
    ALTER TABLE dbo.GoldenManifests WITH CHECK CHECK CONSTRAINT FK_GoldenManifests_DecisioningTraces_DecisionTraceId;
GO

IF OBJECT_ID(N'dbo.ArtifactBundles', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ArtifactBundles_Runs_RunId' AND is_not_trusted = 1)
    ALTER TABLE dbo.ArtifactBundles WITH CHECK CHECK CONSTRAINT FK_ArtifactBundles_Runs_RunId;
GO

IF OBJECT_ID(N'dbo.ArtifactBundles', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ArtifactBundles_GoldenManifests_ManifestId' AND is_not_trusted = 1)
    ALTER TABLE dbo.ArtifactBundles WITH CHECK CHECK CONSTRAINT FK_ArtifactBundles_GoldenManifests_ManifestId;
GO
