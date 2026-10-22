/*
  Rollback 351: drop audit control evaluations and evidence items.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AuditEvidenceItems', N'U') IS NOT NULL
    DROP TABLE dbo.AuditEvidenceItems;
GO

IF OBJECT_ID(N'dbo.AuditControlEvaluations', N'U') IS NOT NULL
    DROP TABLE dbo.AuditControlEvaluations;
GO
