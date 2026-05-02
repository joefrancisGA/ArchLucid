/*
  Deferred authority pipeline outbox — lease, exponential backoff retries, dead-letter telemetry.

  Mirrors dbo.IntegrationEventOutbox patterns (deferral/backoff/dead-letter).
*/

IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'AttemptCount') IS NULL
BEGIN
    ALTER TABLE dbo.AuthorityPipelineWorkOutbox ADD AttemptCount INT NOT NULL
        CONSTRAINT DF_AuthorityPipelineWorkOutbox_AttemptCount DEFAULT ((0));
END;
GO

IF COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'LockedUntilUtc') IS NULL
BEGIN
    ALTER TABLE dbo.AuthorityPipelineWorkOutbox ADD LockedUntilUtc DATETIME2 NULL;
END;
GO

IF COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'NextAttemptUtc') IS NULL
BEGIN
    ALTER TABLE dbo.AuthorityPipelineWorkOutbox ADD NextAttemptUtc DATETIME2 NULL;
END;
GO

IF COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'LastAttemptError') IS NULL
BEGIN
    ALTER TABLE dbo.AuthorityPipelineWorkOutbox ADD LastAttemptError NVARCHAR(400) NULL;
END;
GO

IF COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'DeadLetteredUtc') IS NULL
BEGIN
    ALTER TABLE dbo.AuthorityPipelineWorkOutbox ADD DeadLetteredUtc DATETIME2 NULL;
END;
GO
