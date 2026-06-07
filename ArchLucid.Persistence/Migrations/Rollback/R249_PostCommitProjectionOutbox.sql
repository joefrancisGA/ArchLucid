IF OBJECT_ID(N'dbo.PostCommitProjectionOutbox', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.PostCommitProjectionOutbox;
END;
GO
