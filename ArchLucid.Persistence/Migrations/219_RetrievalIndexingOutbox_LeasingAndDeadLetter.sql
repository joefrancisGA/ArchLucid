/*
  Retrieval indexing outbox — exclusive lease, retry backoff, dead-letter telemetry.

  Mirrors dbo.AuthorityPipelineWorkOutbox patterns (deferral/backoff/dead-letter).
*/

IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'AttemptCount') IS NULL
BEGIN
    ALTER TABLE dbo.RetrievalIndexingOutbox ADD AttemptCount INT NOT NULL
        CONSTRAINT DF_RetrievalIndexingOutbox_AttemptCount DEFAULT ((0));
END;
GO

IF COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'LockedUntilUtc') IS NULL
BEGIN
    ALTER TABLE dbo.RetrievalIndexingOutbox ADD LockedUntilUtc DATETIME2(7) NULL;
END;
GO

IF COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'NextAttemptUtc') IS NULL
BEGIN
    ALTER TABLE dbo.RetrievalIndexingOutbox ADD NextAttemptUtc DATETIME2(7) NULL;
END;
GO

IF COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'LastAttemptError') IS NULL
BEGIN
    ALTER TABLE dbo.RetrievalIndexingOutbox ADD LastAttemptError NVARCHAR(400) NULL;
END;
GO

IF COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'DeadLetteredUtc') IS NULL
BEGIN
    ALTER TABLE dbo.RetrievalIndexingOutbox ADD DeadLetteredUtc DATETIME2(7) NULL;
END;
GO
