/* Rollback for 127_StateConstraints_Batch.sql */

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_FailedNoArtifact' AND parent_object_id = OBJECT_ID(N'dbo.Runs'))
    ALTER TABLE dbo.Runs DROP CONSTRAINT CK_Runs_FailedNoArtifact;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_FailedNoManifest' AND parent_object_id = OBJECT_ID(N'dbo.Runs'))
    ALTER TABLE dbo.Runs DROP CONSTRAINT CK_Runs_FailedNoManifest;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_CommittedHasCompletedUtc' AND parent_object_id = OBJECT_ID(N'dbo.Runs'))
    ALTER TABLE dbo.Runs DROP CONSTRAINT CK_Runs_CommittedHasCompletedUtc;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_CommittedHasManifest' AND parent_object_id = OBJECT_ID(N'dbo.Runs'))
    ALTER TABLE dbo.Runs DROP CONSTRAINT CK_Runs_CommittedHasManifest;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_LegacyRunStatus' AND parent_object_id = OBJECT_ID(N'dbo.Runs'))
    ALTER TABLE dbo.Runs DROP CONSTRAINT CK_Runs_LegacyRunStatus;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_FindingRecords_ReviewedAtWhenReviewed' AND parent_object_id = OBJECT_ID(N'dbo.FindingRecords'))
    ALTER TABLE dbo.FindingRecords DROP CONSTRAINT CK_FindingRecords_ReviewedAtWhenReviewed;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_FindingRecords_ReviewedByWhenReviewed' AND parent_object_id = OBJECT_ID(N'dbo.FindingRecords'))
    ALTER TABLE dbo.FindingRecords DROP CONSTRAINT CK_FindingRecords_ReviewedByWhenReviewed;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ArtifactBundleArtifacts_GenerationStatus' AND parent_object_id = OBJECT_ID(N'dbo.ArtifactBundleArtifacts'))
    ALTER TABLE dbo.ArtifactBundleArtifacts DROP CONSTRAINT CK_ArtifactBundleArtifacts_GenerationStatus;
GO

IF COL_LENGTH(N'dbo.ArtifactBundleArtifacts', N'GenerationStatus') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ArtifactBundleArtifacts DROP CONSTRAINT DF_ArtifactBundleArtifacts_GenerationStatus_Db127;
    ALTER TABLE dbo.ArtifactBundleArtifacts DROP COLUMN GenerationStatus;
END;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ArtifactBundles_Status' AND parent_object_id = OBJECT_ID(N'dbo.ArtifactBundles'))
    ALTER TABLE dbo.ArtifactBundles DROP CONSTRAINT CK_ArtifactBundles_Status;
GO

IF COL_LENGTH(N'dbo.ArtifactBundles', N'Status') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ArtifactBundles DROP CONSTRAINT DF_ArtifactBundles_Status_Db127;
    ALTER TABLE dbo.ArtifactBundles DROP COLUMN Status;
END;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_GoldenManifests_LifecycleStatus' AND parent_object_id = OBJECT_ID(N'dbo.GoldenManifests'))
    ALTER TABLE dbo.GoldenManifests DROP CONSTRAINT CK_GoldenManifests_LifecycleStatus;
GO

IF COL_LENGTH(N'dbo.GoldenManifests', N'LifecycleStatus') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GoldenManifests DROP CONSTRAINT DF_GoldenManifests_LifecycleStatus_Db127;
    ALTER TABLE dbo.GoldenManifests DROP COLUMN LifecycleStatus;
END;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_FindingsSnapshots_GenerationStatus' AND parent_object_id = OBJECT_ID(N'dbo.FindingsSnapshots'))
    ALTER TABLE dbo.FindingsSnapshots DROP CONSTRAINT CK_FindingsSnapshots_GenerationStatus;
GO

IF COL_LENGTH(N'dbo.FindingsSnapshots', N'GenerationStatus') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FindingsSnapshots DROP CONSTRAINT DF_FindingsSnapshots_GenerationStatus_Db127;
    ALTER TABLE dbo.FindingsSnapshots DROP COLUMN GenerationStatus;
END;
GO
