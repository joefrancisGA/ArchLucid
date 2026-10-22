/*
  168: System-level durable audit (dbo.PlatformAuditEvents) for platform operations outside tenant-scoped dbo.AuditEvents.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.PlatformAuditEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlatformAuditEvents
    (
        EventId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PlatformAuditEvents PRIMARY KEY,
        OccurredUtc DATETIME2 NOT NULL CONSTRAINT DF_PlatformAuditEvents_OccurredUtc DEFAULT SYSUTCDATETIME(),
        EventType NVARCHAR(100) NOT NULL,
        ActorUserId NVARCHAR(200) NOT NULL,
        ActorUserName NVARCHAR(200) NOT NULL,
        SubjectTenantId UNIQUEIDENTIFIER NOT NULL,
        DataJson NVARCHAR(MAX) NOT NULL CONSTRAINT DF_PlatformAuditEvents_DataJson DEFAULT (N'{}'),
        CorrelationId NVARCHAR(200) NULL,
        INDEX IX_PlatformAuditEvents_SubjectTenantId_OccurredUtc NONCLUSTERED (SubjectTenantId, OccurredUtc DESC),
        INDEX IX_PlatformAuditEvents_EventType_OccurredUtc NONCLUSTERED (EventType, OccurredUtc DESC)
    );
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.PlatformAuditEvents', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.database_permissions AS dp
        INNER JOIN sys.database_principals AS gp ON dp.grantee_principal_id = gp.principal_id
        WHERE dp.class_desc = N'OBJECT_OR_COLUMN'
          AND dp.major_id = OBJECT_ID(N'dbo.PlatformAuditEvents')
          AND dp.permission_name = N'UPDATE'
          AND dp.state_desc = N'DENY'
          AND gp.name = N'ArchLucidApp')
BEGIN
    DENY UPDATE ON dbo.PlatformAuditEvents TO [ArchLucidApp];
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.PlatformAuditEvents', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.database_permissions AS dp
        INNER JOIN sys.database_principals AS gp ON dp.grantee_principal_id = gp.principal_id
        WHERE dp.class_desc = N'OBJECT_OR_COLUMN'
          AND dp.major_id = OBJECT_ID(N'dbo.PlatformAuditEvents')
          AND dp.permission_name = N'DELETE'
          AND dp.state_desc = N'DENY'
          AND gp.name = N'ArchLucidApp')
BEGIN
    DENY DELETE ON dbo.PlatformAuditEvents TO [ArchLucidApp];
END;
GO
