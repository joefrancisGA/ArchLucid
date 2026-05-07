/*
  Migration 147: Authority chain FKs to dbo.Runs — brownfield prevention (add with NOCHECK when missing).

  Purpose: Migration 134 adds the same keys only when no orphan rows would violate them. Catalogs that
  already held legacy orphans never received those FKs, so new orphan rows could still be inserted.
  This migration adds any missing constraints using ALTER TABLE ... WITH NOCHECK ADD CONSTRAINT so
  existing rows are not validated while new inserts/updates must satisfy dbo.Runs (and the rest of
  the chain).

  Idempotent: each constraint is created only if absent (same names as 134 / 027 / ArchLucid.sql).

  ON DELETE omitted => NO ACTION (SQL Server default).

  Rollback: Rollback/R134_FK_Authority_Chain_Runs_DbUpParity.sql for the chain through ContextSnapshots;
  additionally drop FK_ArtifactBundles_* if reverting bundle wiring only (027 parity).
*/

SET NOCOUNT ON;
GO

/* ---- ContextSnapshots -> Runs ---- */
IF OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ContextSnapshots_Runs_RunId')
BEGIN
    ALTER TABLE dbo.ContextSnapshots WITH NOCHECK ADD CONSTRAINT FK_ContextSnapshots_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO

/* ---- GraphSnapshots -> ContextSnapshots, Runs ---- */
IF OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GraphSnapshots_ContextSnapshots_ContextSnapshotId')
BEGIN
    ALTER TABLE dbo.GraphSnapshots WITH NOCHECK ADD CONSTRAINT FK_GraphSnapshots_ContextSnapshots_ContextSnapshotId
        FOREIGN KEY (ContextSnapshotId) REFERENCES dbo.ContextSnapshots (SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GraphSnapshots_Runs_RunId')
BEGIN
    ALTER TABLE dbo.GraphSnapshots WITH NOCHECK ADD CONSTRAINT FK_GraphSnapshots_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO

/* ---- FindingsSnapshots ---- */
IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_Runs_RunId')
BEGIN
    ALTER TABLE dbo.FindingsSnapshots WITH NOCHECK ADD CONSTRAINT FK_FindingsSnapshots_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId')
BEGIN
    ALTER TABLE dbo.FindingsSnapshots WITH NOCHECK ADD CONSTRAINT FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId
        FOREIGN KEY (ContextSnapshotId) REFERENCES dbo.ContextSnapshots (SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_GraphSnapshots_GraphSnapshotId')
BEGIN
    ALTER TABLE dbo.FindingsSnapshots WITH NOCHECK ADD CONSTRAINT FK_FindingsSnapshots_GraphSnapshots_GraphSnapshotId
        FOREIGN KEY (GraphSnapshotId) REFERENCES dbo.GraphSnapshots (GraphSnapshotId);
END;
GO

/* ---- DecisioningTraces -> Runs ---- */
IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DecisioningTraces_Runs_RunId')
BEGIN
    ALTER TABLE dbo.DecisioningTraces WITH NOCHECK ADD CONSTRAINT FK_DecisioningTraces_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO

/* ---- GoldenManifests (chain) ---- */
IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_Runs_RunId')
BEGIN
    ALTER TABLE dbo.GoldenManifests WITH NOCHECK ADD CONSTRAINT FK_GoldenManifests_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_ContextSnapshots_ContextSnapshotId')
BEGIN
    ALTER TABLE dbo.GoldenManifests WITH NOCHECK ADD CONSTRAINT FK_GoldenManifests_ContextSnapshots_ContextSnapshotId
        FOREIGN KEY (ContextSnapshotId) REFERENCES dbo.ContextSnapshots (SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_GraphSnapshots_GraphSnapshotId')
BEGIN
    ALTER TABLE dbo.GoldenManifests WITH NOCHECK ADD CONSTRAINT FK_GoldenManifests_GraphSnapshots_GraphSnapshotId
        FOREIGN KEY (GraphSnapshotId) REFERENCES dbo.GraphSnapshots (GraphSnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_FindingsSnapshots_FindingsSnapshotId')
BEGIN
    ALTER TABLE dbo.GoldenManifests WITH NOCHECK ADD CONSTRAINT FK_GoldenManifests_FindingsSnapshots_FindingsSnapshotId
        FOREIGN KEY (FindingsSnapshotId) REFERENCES dbo.FindingsSnapshots (FindingsSnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_DecisioningTraces_DecisionTraceId')
BEGIN
    ALTER TABLE dbo.GoldenManifests WITH NOCHECK ADD CONSTRAINT FK_GoldenManifests_DecisioningTraces_DecisionTraceId
        FOREIGN KEY (DecisionTraceId) REFERENCES dbo.DecisioningTraces (DecisionTraceId);
END;
GO

/* ---- ArtifactBundles (027 / master parity) ---- */
IF OBJECT_ID(N'dbo.ArtifactBundles', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ArtifactBundles_Runs_RunId')
BEGIN
    ALTER TABLE dbo.ArtifactBundles WITH NOCHECK ADD CONSTRAINT FK_ArtifactBundles_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO

IF OBJECT_ID(N'dbo.ArtifactBundles', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ArtifactBundles_GoldenManifests_ManifestId')
BEGIN
    ALTER TABLE dbo.ArtifactBundles WITH NOCHECK ADD CONSTRAINT FK_ArtifactBundles_GoldenManifests_ManifestId
        FOREIGN KEY (ManifestId) REFERENCES dbo.GoldenManifests (ManifestId);
END;
GO
