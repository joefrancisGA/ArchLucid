-- 099: Operational quarantine table for graded data-consistency enforcement (golden-manifest orphans).

IF OBJECT_ID(N'dbo.DataConsistencyQuarantine', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DataConsistencyQuarantine
    (
        QuarantineId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_DataConsistencyQuarantine PRIMARY KEY CLUSTERED,
        TenantId     UNIQUEIDENTIFIER NOT NULL,
        SourceTable  NVARCHAR(128)     NOT NULL,
        SourceColumn NVARCHAR(128)     NOT NULL,
        SourceRowKey NVARCHAR(256)     NOT NULL,
        DetectedUtc  DATETIME2(7)      NOT NULL,
        ReasonJson   NVARCHAR(MAX)     NULL,
        CONSTRAINT UQ_DataConsistencyQuarantine_Source UNIQUE (SourceTable, SourceColumn, SourceRowKey)
    );

    CREATE NONCLUSTERED INDEX IX_DataConsistencyQuarantine_TenantId_DetectedUtc
        ON dbo.DataConsistencyQuarantine (TenantId, DetectedUtc DESC);
END;
GO
