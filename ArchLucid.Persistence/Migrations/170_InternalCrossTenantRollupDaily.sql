/*
  170: Pseudonymized internal cross-tenant daily rollups (system catalog).

  No tenant id, slug, domain, or display name columns — AnalyticsTenantKey only.
  RLS not applied; access via operator RBAC / internal service principal only.
*/

IF OBJECT_ID(N'dbo.InternalCrossTenantRollupDaily', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.InternalCrossTenantRollupDaily
    (
        RollupDate                          DATE             NOT NULL,
        AnalyticsTenantKey                  CHAR(64)         NOT NULL,
        TotalRunsNonArchived                BIGINT           NOT NULL
            CONSTRAINT DF_InternalCrossTenantRollupDaily_TotalRuns DEFAULT (0),
        TotalCompletedRuns                  BIGINT           NOT NULL
            CONSTRAINT DF_InternalCrossTenantRollupDaily_CompletedRuns DEFAULT (0),
        SumCompletionSeconds                FLOAT            NOT NULL
            CONSTRAINT DF_InternalCrossTenantRollupDaily_SumSeconds DEFAULT (0.0),
        EstimatedEngineeringHoursSaved      DECIMAL(18, 2)   NOT NULL
            CONSTRAINT DF_InternalCrossTenantRollupDaily_HoursSaved DEFAULT (0),
        LlmTokensUsed                       BIGINT           NULL,
        ComputedUtc                         DATETIME2(7)     NOT NULL
            CONSTRAINT DF_InternalCrossTenantRollupDaily_ComputedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_InternalCrossTenantRollupDaily PRIMARY KEY CLUSTERED (RollupDate, AnalyticsTenantKey),
        CONSTRAINT CK_InternalCrossTenantRollupDaily_KeyHex CHECK (AnalyticsTenantKey NOT LIKE '%[^0-9a-f]%')
    );

    CREATE NONCLUSTERED INDEX IX_InternalCrossTenantRollupDaily_ComputedUtc
        ON dbo.InternalCrossTenantRollupDaily (ComputedUtc DESC);
END;
GO
