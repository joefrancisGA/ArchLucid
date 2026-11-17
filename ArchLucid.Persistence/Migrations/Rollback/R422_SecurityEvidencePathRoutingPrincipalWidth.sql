/* R422: Restore the routing principal length only when no values would be lost. */
IF COL_LENGTH(N'dbo.SecurityEvidencePathRouting', N'PrincipalId') = 1024
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.SecurityEvidencePathRouting WHERE DATALENGTH(PrincipalId) > 512)
        THROW 51000, 'Routing principal values exceed the rollback width.', 1;

    ALTER TABLE dbo.SecurityEvidencePathRouting
        ALTER COLUMN PrincipalId NVARCHAR(256) NULL;
END;
GO
