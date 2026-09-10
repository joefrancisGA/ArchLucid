/*
  384: Remediation instance path narrative (SA-14).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RemediationInstances', N'PathId') IS NULL
BEGIN
    ALTER TABLE dbo.RemediationInstances
        ADD PathId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RemediationInstances', N'PathNarrativeJson') IS NULL
BEGIN
    ALTER TABLE dbo.RemediationInstances
        ADD PathNarrativeJson NVARCHAR(MAX) NULL;
END;
GO

IF OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RemediationInstances', N'PathId') IS NOT NULL
   AND OBJECT_ID(N'dbo.SecurityEvidencePaths', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_RemediationInstances_SecurityEvidencePaths'
         AND parent_object_id = OBJECT_ID(N'dbo.RemediationInstances'))
BEGIN
    ALTER TABLE dbo.RemediationInstances
        ADD CONSTRAINT FK_RemediationInstances_SecurityEvidencePaths
            FOREIGN KEY (PathId) REFERENCES dbo.SecurityEvidencePaths (PathId);
END;
GO
