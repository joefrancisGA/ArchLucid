/*
  Rollback 384: Remediation instance path narrative (SA-14).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_RemediationInstances_SecurityEvidencePaths'
         AND parent_object_id = OBJECT_ID(N'dbo.RemediationInstances'))
BEGIN
    ALTER TABLE dbo.RemediationInstances
        DROP CONSTRAINT FK_RemediationInstances_SecurityEvidencePaths;
END;
GO

IF OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RemediationInstances', N'PathNarrativeJson') IS NOT NULL
BEGIN
    ALTER TABLE dbo.RemediationInstances
        DROP COLUMN PathNarrativeJson;
END;
GO

IF OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RemediationInstances', N'PathId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.RemediationInstances
        DROP COLUMN PathId;
END;
GO
