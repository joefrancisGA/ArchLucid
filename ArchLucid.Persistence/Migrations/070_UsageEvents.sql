/*
  070: Per-tenant usage metering (dbo.UsageEvents) + RLS on rls.ArchiforgeTenantScope.
*/
IF OBJECT_ID(N'dbo.UsageEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UsageEvents
    (
        Id             UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_UsageEvents_Id DEFAULT NEWSEQUENTIALID(),
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId    UNIQUEIDENTIFIER NOT NULL,
        ProjectId      UNIQUEIDENTIFIER NOT NULL,
        Kind           NVARCHAR(64)     NOT NULL,
        Quantity       BIGINT           NOT NULL,
        RecordedUtc    DATETIMEOFFSET   NOT NULL CONSTRAINT DF_UsageEvents_RecordedUtc DEFAULT SYSUTCDATETIME(),
        CorrelationId  NVARCHAR(256)    NULL,
        CONSTRAINT PK_UsageEvents PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT CK_UsageEvents_Quantity CHECK (Quantity >= 0)
    );

    CREATE NONCLUSTERED INDEX IX_UsageEvents_TenantRecorded ON dbo.UsageEvents (TenantId, RecordedUtc);
    CREATE NONCLUSTERED INDEX IX_UsageEvents_KindRecorded ON dbo.UsageEvents (Kind, RecordedUtc);
END;
GO

