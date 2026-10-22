/*
  TB-085 / TB-086 — durable backfill checkpoint cursor and poison-row quarantine.
*/

IF OBJECT_ID(N'dbo.BackfillCheckpoints', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BackfillCheckpoints
    (
        Stage                    NVARCHAR(64)     NOT NULL
            CONSTRAINT PK_BackfillCheckpoints PRIMARY KEY,
        LastProcessedCreatedUtc  DATETIME2(7)     NOT NULL,
        LastProcessedKey         NVARCHAR(128)    NOT NULL,
        UpdatedUtc               DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_BackfillCheckpoints_UpdatedUtc DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID(N'dbo.BackfillFailures', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BackfillFailures
    (
        Stage                    NVARCHAR(64)     NOT NULL,
        EntityKey                NVARCHAR(128)    NOT NULL,
        FailureCount             INT              NOT NULL,
        LastError                NVARCHAR(MAX)    NOT NULL,
        LastAttemptUtc           DATETIMEOFFSET(7) NOT NULL,
        SkippedAfterMaxRetries   BIT              NOT NULL
            CONSTRAINT DF_BackfillFailures_SkippedAfterMaxRetries DEFAULT (0),
        CONSTRAINT PK_BackfillFailures PRIMARY KEY (Stage, EntityKey)
    );

    CREATE NONCLUSTERED INDEX IX_BackfillFailures_Stage_Skipped
        ON dbo.BackfillFailures (Stage, SkippedAfterMaxRetries)
        INCLUDE (FailureCount, LastAttemptUtc);
END;
GO
