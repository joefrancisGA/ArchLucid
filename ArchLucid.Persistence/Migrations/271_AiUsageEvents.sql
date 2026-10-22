/*
  271: AI usage events for demo/trial governance dashboards.
*/

SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.AiUsageEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AiUsageEvents
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AiUsageEvents PRIMARY KEY,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        UserId              NVARCHAR(256)    NULL,
        Feature             NVARCHAR(64)     NOT NULL,
        ProviderKind        NVARCHAR(64)     NOT NULL,
        InputTokens         INT              NOT NULL CONSTRAINT DF_AiUsageEvents_InputTokens DEFAULT (0),
        OutputTokens        INT              NOT NULL CONSTRAINT DF_AiUsageEvents_OutputTokens DEFAULT (0),
        EstimatedCostUsd    DECIMAL(18, 6)   NOT NULL CONSTRAINT DF_AiUsageEvents_EstimatedCostUsd DEFAULT (0),
        ActualCostUsd       DECIMAL(18, 6)   NULL,
        OccurredUtc         DATETIMEOFFSET   NOT NULL CONSTRAINT DF_AiUsageEvents_OccurredUtc DEFAULT SYSUTCDATETIME(),
        CorrelationId       NVARCHAR(128)    NULL,
        ServedFromDemoCache BIT              NOT NULL CONSTRAINT DF_AiUsageEvents_ServedFromDemoCache DEFAULT (0),
        BudgetBlocked       BIT              NOT NULL CONSTRAINT DF_AiUsageEvents_BudgetBlocked DEFAULT (0)
    );

    CREATE NONCLUSTERED INDEX IX_AiUsageEvents_TenantOccurred ON dbo.AiUsageEvents (TenantId, OccurredUtc DESC);
END;
GO
