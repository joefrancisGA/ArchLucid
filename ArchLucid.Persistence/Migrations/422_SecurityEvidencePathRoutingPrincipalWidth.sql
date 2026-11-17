/* 422: Preserve inventory tag values in the routing principal. */

IF COL_LENGTH(N'dbo.SecurityEvidencePathRouting', N'PrincipalId') = 512
BEGIN
    ALTER TABLE dbo.SecurityEvidencePathRouting
        ALTER COLUMN PrincipalId NVARCHAR(512) NULL;
END;
GO
