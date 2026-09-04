/*
  Rollback 350: drop audit evidence requirements.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AuditEvidenceRequirements', N'U') IS NOT NULL
    DROP TABLE dbo.AuditEvidenceRequirements;
GO
