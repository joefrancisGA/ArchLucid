/*
  Rollback 381: drop SecureNow architect security evidence path tables and PathId column.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.FK_OperationalSecurityFindings_SecurityEvidencePaths', N'F') IS NOT NULL
    ALTER TABLE dbo.OperationalSecurityFindings DROP CONSTRAINT FK_OperationalSecurityFindings_SecurityEvidencePaths;
GO

IF COL_LENGTH(N'dbo.OperationalSecurityFindings', N'PathId') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_OperationalSecurityFindings_Tenant_PathId'
          AND object_id = OBJECT_ID(N'dbo.OperationalSecurityFindings'))
        DROP INDEX IX_OperationalSecurityFindings_Tenant_PathId ON dbo.OperationalSecurityFindings;

    ALTER TABLE dbo.OperationalSecurityFindings DROP COLUMN PathId;
END;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathHops', N'U') IS NOT NULL
    DROP TABLE dbo.SecurityEvidencePathHops;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePaths', N'U') IS NOT NULL
    DROP TABLE dbo.SecurityEvidencePaths;
GO
