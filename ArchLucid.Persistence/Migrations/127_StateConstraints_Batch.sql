/* State machine columns + CHECK constraints (docs/library/STATE_MACHINES.md). */

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingsSnapshots', N'GenerationStatus') IS NULL
BEGIN
    ALTER TABLE dbo.FindingsSnapshots ADD GenerationStatus NVARCHAR(32) NOT NULL
        CONSTRAINT DF_FindingsSnapshots_GenerationStatus_Db127 DEFAULT (N'Complete');
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_FindingsSnapshots_GenerationStatus')
   AND OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FindingsSnapshots ADD CONSTRAINT CK_FindingsSnapshots_GenerationStatus
        CHECK (GenerationStatus IN (N'Generating', N'Complete', N'PartiallyComplete', N'Failed'));
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifests', N'LifecycleStatus') IS NULL
BEGIN
    ALTER TABLE dbo.GoldenManifests ADD LifecycleStatus NVARCHAR(32) NOT NULL
        CONSTRAINT DF_GoldenManifests_LifecycleStatus_Db127 DEFAULT (N'Active');
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_GoldenManifests_LifecycleStatus')
   AND OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GoldenManifests ADD CONSTRAINT CK_GoldenManifests_LifecycleStatus
        CHECK (LifecycleStatus IN (N'Active', N'Superseded', N'Archived'));
END;
GO

IF OBJECT_ID(N'dbo.ArtifactBundles', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArtifactBundles', N'Status') IS NULL
BEGIN
    ALTER TABLE dbo.ArtifactBundles ADD Status NVARCHAR(32) NOT NULL
        CONSTRAINT DF_ArtifactBundles_Status_Db127 DEFAULT (N'Available');
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ArtifactBundles_Status')
   AND OBJECT_ID(N'dbo.ArtifactBundles', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ArtifactBundles ADD CONSTRAINT CK_ArtifactBundles_Status
        CHECK (Status IN (N'Pending', N'Available', N'Partial', N'Failed', N'Archived'));
END;
GO

IF OBJECT_ID(N'dbo.ArtifactBundleArtifacts', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArtifactBundleArtifacts', N'GenerationStatus') IS NULL
BEGIN
    ALTER TABLE dbo.ArtifactBundleArtifacts ADD GenerationStatus NVARCHAR(32) NOT NULL
        CONSTRAINT DF_ArtifactBundleArtifacts_GenerationStatus_Db127 DEFAULT (N'Generated');
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ArtifactBundleArtifacts_GenerationStatus')
   AND OBJECT_ID(N'dbo.ArtifactBundleArtifacts', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ArtifactBundleArtifacts ADD CONSTRAINT CK_ArtifactBundleArtifacts_GenerationStatus
        CHECK (GenerationStatus IN (N'Pending', N'Generated', N'Failed'));
END;
GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    UPDATE dbo.Runs
    SET CompletedUtc = COALESCE(CompletedUtc, CreatedUtc, SYSUTCDATETIME())
    WHERE LegacyRunStatus IN (N'Committed', N'Failed')
      AND CompletedUtc IS NULL;

    UPDATE dbo.Runs
    SET GoldenManifestId = NULL
    WHERE LegacyRunStatus = N'Failed'
      AND GoldenManifestId IS NOT NULL;

    UPDATE dbo.Runs
    SET ArtifactBundleId = NULL
    WHERE LegacyRunStatus = N'Failed'
      AND ArtifactBundleId IS NOT NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_FindingRecords_ReviewedByWhenReviewed')
   AND OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.FindingRecords
        WHERE HumanReviewStatus IN (N'Approved', N'Rejected', N'Overridden')
          AND ReviewedByUserId IS NULL)
BEGIN
    ALTER TABLE dbo.FindingRecords ADD CONSTRAINT CK_FindingRecords_ReviewedByWhenReviewed
        CHECK (
            HumanReviewStatus NOT IN (N'Approved', N'Rejected', N'Overridden')
            OR ReviewedByUserId IS NOT NULL
        );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_FindingRecords_ReviewedAtWhenReviewed')
   AND OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.FindingRecords
        WHERE HumanReviewStatus IN (N'Approved', N'Rejected', N'Overridden')
          AND ReviewedAtUtc IS NULL)
BEGIN
    ALTER TABLE dbo.FindingRecords ADD CONSTRAINT CK_FindingRecords_ReviewedAtWhenReviewed
        CHECK (
            HumanReviewStatus NOT IN (N'Approved', N'Rejected', N'Overridden')
            OR ReviewedAtUtc IS NOT NULL
        );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_LegacyRunStatus')
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs ADD CONSTRAINT CK_Runs_LegacyRunStatus
        CHECK (LegacyRunStatus IN (
            N'Created', N'TasksGenerated', N'WaitingForResults',
            N'ReadyForCommit', N'Committed', N'Failed', N'Retrying')
              OR LegacyRunStatus IS NULL);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_CommittedHasManifest')
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1 FROM dbo.Runs WHERE LegacyRunStatus = N'Committed' AND GoldenManifestId IS NULL)
BEGIN
    ALTER TABLE dbo.Runs ADD CONSTRAINT CK_Runs_CommittedHasManifest
        CHECK (LegacyRunStatus <> N'Committed' OR GoldenManifestId IS NOT NULL);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_CommittedHasCompletedUtc')
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.Runs
        WHERE LegacyRunStatus IN (N'Committed', N'Failed')
          AND CompletedUtc IS NULL)
BEGIN
    ALTER TABLE dbo.Runs ADD CONSTRAINT CK_Runs_CommittedHasCompletedUtc
        CHECK (LegacyRunStatus NOT IN (N'Committed', N'Failed') OR CompletedUtc IS NOT NULL);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_FailedNoManifest')
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs ADD CONSTRAINT CK_Runs_FailedNoManifest
        CHECK (LegacyRunStatus <> N'Failed' OR GoldenManifestId IS NULL);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_FailedNoArtifact')
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs ADD CONSTRAINT CK_Runs_FailedNoArtifact
        CHECK (LegacyRunStatus <> N'Failed' OR ArtifactBundleId IS NULL);
END;
GO
