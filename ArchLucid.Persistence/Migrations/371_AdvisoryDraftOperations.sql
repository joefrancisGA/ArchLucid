/* 371 — DR-14: durable tenant-scoped advisory draft async operations. */

IF OBJECT_ID(N'dbo.AdvisoryDraftOperations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AdvisoryDraftOperations
    (
        TenantId      UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId   UNIQUEIDENTIFIER NOT NULL,
        ProjectId     UNIQUEIDENTIFIER NOT NULL,
        OperationId   UNIQUEIDENTIFIER NOT NULL,
        State         INT              NOT NULL,
        StepLabel     NVARCHAR(256)    NOT NULL,
        CurrentStep   INT              NOT NULL,
        CreatedUtc    DATETIME2(3)     NOT NULL CONSTRAINT DF_AdvisoryDraftOperations_CreatedUtc DEFAULT (SYSUTCDATETIME()),
        HeartbeatUtc  DATETIME2(3)     NOT NULL,
        CompletedUtc  DATETIME2(3)     NULL,
        ResultJson    NVARCHAR(MAX)    NULL,
        ErrorMessage  NVARCHAR(2000)   NULL,
        CONSTRAINT PK_AdvisoryDraftOperations PRIMARY KEY (TenantId, WorkspaceId, ProjectId, OperationId),
        CONSTRAINT CK_AdvisoryDraftOperations_State CHECK (State BETWEEN 0 AND 5),
        CONSTRAINT CK_AdvisoryDraftOperations_ResultJson CHECK (ResultJson IS NULL OR ISJSON(ResultJson) = 1)
    );

    CREATE NONCLUSTERED INDEX IX_AdvisoryDraftOperations_Scope_Heartbeat
        ON dbo.AdvisoryDraftOperations (TenantId, WorkspaceId, ProjectId, HeartbeatUtc DESC);
END;
GO
