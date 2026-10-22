-- Optional Idempotency-Key on POST /architecture/request: one row per (scope, key hash).
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ArchitectureRunIdempotency' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.ArchitectureRunIdempotency
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        IdempotencyKeyHash VARBINARY(32) NOT NULL,
        RequestFingerprint VARBINARY(32) NOT NULL,
        RunId NVARCHAR(64) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        CONSTRAINT PK_ArchitectureRunIdempotency PRIMARY KEY (TenantId, WorkspaceId, ProjectId, IdempotencyKeyHash)
    );
END
GO

-- Legacy FK to dbo.ArchitectureRuns (dropped in 049). Skip when drift-repair replays after ArchitectureRuns is gone.
IF OBJECT_ID(N'dbo.ArchitectureRuns', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.ArchitectureRunIdempotency', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ArchitectureRunIdempotency_Run')
BEGIN
    ALTER TABLE dbo.ArchitectureRunIdempotency
        ADD CONSTRAINT FK_ArchitectureRunIdempotency_Run FOREIGN KEY (RunId) REFERENCES dbo.ArchitectureRuns (RunId);
END
GO
