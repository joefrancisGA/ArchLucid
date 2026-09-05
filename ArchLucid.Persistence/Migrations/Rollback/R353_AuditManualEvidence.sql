/*
  Rollback 353: drop manual audit evidence tables.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AuditArchitectureEvidenceLinks', N'U') IS NOT NULL
    DROP TABLE dbo.AuditArchitectureEvidenceLinks;
GO

IF OBJECT_ID(N'dbo.AuditManualEvidenceSubmissions', N'U') IS NOT NULL
    DROP TABLE dbo.AuditManualEvidenceSubmissions;
GO
