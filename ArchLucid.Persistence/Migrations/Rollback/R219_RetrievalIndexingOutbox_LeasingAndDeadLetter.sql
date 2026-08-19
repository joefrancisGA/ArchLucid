/*
  Reverse DbUp 219 — dbo.RetrievalIndexingOutbox retry/lease/dead-letter columns.
*/

IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'DeadLetteredUtc') IS NOT NULL
    ALTER TABLE dbo.RetrievalIndexingOutbox DROP COLUMN DeadLetteredUtc;
GO

IF COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'LastAttemptError') IS NOT NULL
    ALTER TABLE dbo.RetrievalIndexingOutbox DROP COLUMN LastAttemptError;
GO

IF COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'NextAttemptUtc') IS NOT NULL
    ALTER TABLE dbo.RetrievalIndexingOutbox DROP COLUMN NextAttemptUtc;
GO

IF COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'LockedUntilUtc') IS NOT NULL
    ALTER TABLE dbo.RetrievalIndexingOutbox DROP COLUMN LockedUntilUtc;
GO

IF COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'AttemptCount') IS NOT NULL
BEGIN
    DECLARE @dc sysname =
    (
        SELECT dc.name
        FROM sys.default_constraints dc
        INNER JOIN sys.columns c
                   ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.RetrievalIndexingOutbox')
          AND c.name = N'AttemptCount'
    );

    IF @dc IS NOT NULL
        EXEC(N'ALTER TABLE dbo.RetrievalIndexingOutbox DROP CONSTRAINT ' + QUOTENAME(@dc) + N';');

    ALTER TABLE dbo.RetrievalIndexingOutbox DROP COLUMN AttemptCount;
END;
GO
