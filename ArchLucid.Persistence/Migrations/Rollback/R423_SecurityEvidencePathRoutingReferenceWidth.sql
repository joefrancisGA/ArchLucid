/* R423: Restore the original routing reference width only when no values would be lost. */
IF COL_LENGTH(N'dbo.SecurityEvidencePathRouting', N'SourceReference') = 2570
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.SecurityEvidencePathRouting WHERE DATALENGTH(SourceReference) > 1024)
        THROW 51000, 'Routing source references exceed the rollback width.', 1;

    ALTER TABLE dbo.SecurityEvidencePathRouting
        ALTER COLUMN SourceReference NVARCHAR(512) NOT NULL;
END;
GO
