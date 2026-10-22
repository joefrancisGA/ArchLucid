/* DbUp 157: Architecture projects registry (soft-delete, unique name per workspace among active rows). */
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.Projects', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Projects
    (
        Id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Projects PRIMARY KEY,
        TenantId     UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId  UNIQUEIDENTIFIER NOT NULL,
        Name         NVARCHAR(200)    NOT NULL,
        CreatedUtc   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_Projects_CreatedUtc DEFAULT SYSUTCDATETIME(),
        IsDeleted    BIT              NOT NULL CONSTRAINT DF_Projects_IsDeleted DEFAULT (0),
        CONSTRAINT FK_Projects_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        CONSTRAINT FK_Projects_TenantWorkspaces FOREIGN KEY (WorkspaceId) REFERENCES dbo.TenantWorkspaces (Id)
    );

    CREATE NONCLUSTERED INDEX IX_Projects_TenantId_Workspace_Active
        ON dbo.Projects (TenantId, WorkspaceId)
        WHERE IsDeleted = 0;

    CREATE UNIQUE NONCLUSTERED INDEX UX_Projects_Workspace_Name_Active
        ON dbo.Projects (WorkspaceId, Name)
        WHERE IsDeleted = 0;
END;
GO

/* Backfill: one project per workspace from legacy DefaultProjectId (display name 'default'). */
IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.TenantWorkspaces', N'U') IS NOT NULL
BEGIN
    INSERT INTO dbo.Projects (Id, TenantId, WorkspaceId, Name, CreatedUtc, IsDeleted)
    SELECT tw.DefaultProjectId,
           tw.TenantId,
           tw.Id,
           N'default',
           tw.CreatedUtc,
           0
    FROM dbo.TenantWorkspaces tw
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Projects p WHERE p.Id = tw.DefaultProjectId);
END;
GO
