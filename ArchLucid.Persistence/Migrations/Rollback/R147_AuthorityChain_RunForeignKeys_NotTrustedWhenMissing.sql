/*
  R147: Roll back migration 147 — authority chain FKs added WITH NOCHECK when previously missing.

  Drops the same named constraints 147 may have created (027 / 134 / 147 parity). Artifact bundle
  FKs are removed first because they reference GoldenManifests. Remaining drop order matches R134.
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ArtifactBundles_GoldenManifests_ManifestId' AND parent_object_id = OBJECT_ID(N'dbo.ArtifactBundles'))
    ALTER TABLE dbo.ArtifactBundles DROP CONSTRAINT FK_ArtifactBundles_GoldenManifests_ManifestId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ArtifactBundles_Runs_RunId' AND parent_object_id = OBJECT_ID(N'dbo.ArtifactBundles'))
    ALTER TABLE dbo.ArtifactBundles DROP CONSTRAINT FK_ArtifactBundles_Runs_RunId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_DecisioningTraces_DecisionTraceId' AND parent_object_id = OBJECT_ID(N'dbo.GoldenManifests'))
    ALTER TABLE dbo.GoldenManifests DROP CONSTRAINT FK_GoldenManifests_DecisioningTraces_DecisionTraceId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_FindingsSnapshots_FindingsSnapshotId' AND parent_object_id = OBJECT_ID(N'dbo.GoldenManifests'))
    ALTER TABLE dbo.GoldenManifests DROP CONSTRAINT FK_GoldenManifests_FindingsSnapshots_FindingsSnapshotId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_GraphSnapshots_GraphSnapshotId' AND parent_object_id = OBJECT_ID(N'dbo.GoldenManifests'))
    ALTER TABLE dbo.GoldenManifests DROP CONSTRAINT FK_GoldenManifests_GraphSnapshots_GraphSnapshotId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_ContextSnapshots_ContextSnapshotId' AND parent_object_id = OBJECT_ID(N'dbo.GoldenManifests'))
    ALTER TABLE dbo.GoldenManifests DROP CONSTRAINT FK_GoldenManifests_ContextSnapshots_ContextSnapshotId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_Runs_RunId' AND parent_object_id = OBJECT_ID(N'dbo.GoldenManifests'))
    ALTER TABLE dbo.GoldenManifests DROP CONSTRAINT FK_GoldenManifests_Runs_RunId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DecisioningTraces_Runs_RunId' AND parent_object_id = OBJECT_ID(N'dbo.DecisioningTraces'))
    ALTER TABLE dbo.DecisioningTraces DROP CONSTRAINT FK_DecisioningTraces_Runs_RunId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_GraphSnapshots_GraphSnapshotId' AND parent_object_id = OBJECT_ID(N'dbo.FindingsSnapshots'))
    ALTER TABLE dbo.FindingsSnapshots DROP CONSTRAINT FK_FindingsSnapshots_GraphSnapshots_GraphSnapshotId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId' AND parent_object_id = OBJECT_ID(N'dbo.FindingsSnapshots'))
    ALTER TABLE dbo.FindingsSnapshots DROP CONSTRAINT FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_Runs_RunId' AND parent_object_id = OBJECT_ID(N'dbo.FindingsSnapshots'))
    ALTER TABLE dbo.FindingsSnapshots DROP CONSTRAINT FK_FindingsSnapshots_Runs_RunId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GraphSnapshots_Runs_RunId' AND parent_object_id = OBJECT_ID(N'dbo.GraphSnapshots'))
    ALTER TABLE dbo.GraphSnapshots DROP CONSTRAINT FK_GraphSnapshots_Runs_RunId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GraphSnapshots_ContextSnapshots_ContextSnapshotId' AND parent_object_id = OBJECT_ID(N'dbo.GraphSnapshots'))
    ALTER TABLE dbo.GraphSnapshots DROP CONSTRAINT FK_GraphSnapshots_ContextSnapshots_ContextSnapshotId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ContextSnapshots_Runs_RunId' AND parent_object_id = OBJECT_ID(N'dbo.ContextSnapshots'))
    ALTER TABLE dbo.ContextSnapshots DROP CONSTRAINT FK_ContextSnapshots_Runs_RunId;
GO
