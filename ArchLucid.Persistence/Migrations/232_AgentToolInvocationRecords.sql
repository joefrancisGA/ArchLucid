/*
  TB-110 — structured per-trace tool invocation ledger (redacted previews).
*/

IF OBJECT_ID(N'dbo.AgentToolInvocationRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentToolInvocationRecords
    (
        InvocationRecordId BIGINT           IDENTITY(1, 1) NOT NULL
            CONSTRAINT PK_AgentToolInvocationRecords PRIMARY KEY CLUSTERED,
        TenantId             UNIQUEIDENTIFIER NOT NULL,
        RunId                UNIQUEIDENTIFIER NOT NULL,
        TraceId              NVARCHAR(64)     NOT NULL,
        TaskId               NVARCHAR(64)     NOT NULL,
        SortOrder            INT              NOT NULL,
        ToolName             NVARCHAR(128)    NOT NULL,
        ArgsPreview          NVARCHAR(500)    NOT NULL,
        ResponseSummary      NVARCHAR(500)    NULL,
        Outcome              NVARCHAR(32)     NOT NULL,
        DurationMs           INT              NULL,
        BlobUploadFailed     BIT              NOT NULL
            CONSTRAINT DF_AgentToolInvocationRecords_BlobUploadFailed DEFAULT (0),
        CompletenessNote     NVARCHAR(500)    NULL,
        InvokedAtUtc         DATETIME2(7)     NOT NULL,
        CONSTRAINT UQ_AgentToolInvocationRecords_Trace_Sort UNIQUE (TenantId, TraceId, SortOrder)
    );

    CREATE NONCLUSTERED INDEX IX_AgentToolInvocationRecords_Tenant_Run_Sort
        ON dbo.AgentToolInvocationRecords (TenantId, RunId, SortOrder, InvokedAtUtc);
END;
GO
