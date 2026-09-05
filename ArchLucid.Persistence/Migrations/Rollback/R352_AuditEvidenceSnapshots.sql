/*
  Rollback 352: drop audit evidence snapshots and assessments.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AuditEvidenceBaselines', N'U') IS NOT NULL
    DROP TABLE dbo.AuditEvidenceBaselines;
GO

IF OBJECT_ID(N'dbo.AuditEvidenceSnapshotItems', N'U') IS NOT NULL
    DROP TABLE dbo.AuditEvidenceSnapshotItems;
GO

IF OBJECT_ID(N'dbo.AuditEvidenceSnapshotInventoryLinks', N'U') IS NOT NULL
    DROP TABLE dbo.AuditEvidenceSnapshotInventoryLinks;
GO

IF OBJECT_ID(N'dbo.AuditEvidenceSnapshots', N'U') IS NOT NULL
    DROP TABLE dbo.AuditEvidenceSnapshots;
GO

IF OBJECT_ID(N'dbo.AuditAssessments', N'U') IS NOT NULL
    DROP TABLE dbo.AuditAssessments;
GO
