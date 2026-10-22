/*
  334: Platform-scoped operational error inbox for internal staff review (HTTP, database, and unhandled exceptions).
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.PlatformOperationalErrors', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlatformOperationalErrors
    (
        Id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PlatformOperationalErrors PRIMARY KEY,
        OccurredUtc      DATETIME2(7)     NOT NULL CONSTRAINT DF_PlatformOperationalErrors_OccurredUtc DEFAULT SYSUTCDATETIME(),
        Source           NVARCHAR(32)     NOT NULL,
        Category         NVARCHAR(32)     NOT NULL,
        HttpStatusCode   INT              NULL,
        HttpMethod       NVARCHAR(16)     NULL,
        RequestPath      NVARCHAR(2048)   NULL,
        ProblemType      NVARCHAR(256)    NULL,
        ExceptionType    NVARCHAR(512)    NULL,
        Message          NVARCHAR(2000)   NOT NULL,
        StackTrace       NVARCHAR(MAX)    NULL,
        SqlErrorNumber   INT              NULL,
        SqlErrorState    INT              NULL,
        CorrelationId    NVARCHAR(128)    NULL,
        OtelTraceId      NVARCHAR(64)     NULL,
        TenantId         UNIQUEIDENTIFIER NULL,
        WorkspaceId      UNIQUEIDENTIFIER NULL,
        ProjectId        UNIQUEIDENTIFIER NULL,
        ActorUserId      NVARCHAR(256)    NULL,
        DetailJson       NVARCHAR(MAX)    NOT NULL CONSTRAINT DF_PlatformOperationalErrors_DetailJson DEFAULT (N'{}'),
        INDEX IX_PlatformOperationalErrors_OccurredUtc NONCLUSTERED (OccurredUtc DESC),
        INDEX IX_PlatformOperationalErrors_Category_OccurredUtc NONCLUSTERED (Category, OccurredUtc DESC),
        INDEX IX_PlatformOperationalErrors_CorrelationId NONCLUSTERED (CorrelationId),
        INDEX IX_PlatformOperationalErrors_TenantId_OccurredUtc NONCLUSTERED (TenantId, OccurredUtc DESC),
        INDEX IX_PlatformOperationalErrors_HttpStatusCode_OccurredUtc NONCLUSTERED (HttpStatusCode, OccurredUtc DESC)
    );
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.PlatformOperationalErrors', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.database_permissions AS dp
        INNER JOIN sys.database_principals AS gp ON dp.grantee_principal_id = gp.principal_id
        WHERE dp.class_desc = N'OBJECT_OR_COLUMN'
          AND dp.major_id = OBJECT_ID(N'dbo.PlatformOperationalErrors')
          AND dp.permission_name = N'UPDATE'
          AND dp.state_desc = N'DENY'
          AND gp.name = N'ArchLucidApp')
BEGIN
    DENY UPDATE ON dbo.PlatformOperationalErrors TO [ArchLucidApp];
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.PlatformOperationalErrors', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.database_permissions AS dp
        INNER JOIN sys.database_principals AS gp ON dp.grantee_principal_id = gp.principal_id
        WHERE dp.class_desc = N'OBJECT_OR_COLUMN'
          AND dp.major_id = OBJECT_ID(N'dbo.PlatformOperationalErrors')
          AND dp.permission_name = N'DELETE'
          AND dp.state_desc = N'DENY'
          AND gp.name = N'ArchLucidApp')
BEGIN
    DENY DELETE ON dbo.PlatformOperationalErrors TO [ArchLucidApp];
END;
GO
