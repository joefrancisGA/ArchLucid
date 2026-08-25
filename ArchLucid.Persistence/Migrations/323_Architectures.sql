/*
  323: First-class architecture identity for cross-run recurrence (tenant-scoped).

  Architectures are mutable identity anchors — not sealed records. Drafts remain DraftRequests.

  After ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews. COL_LENGTH on the
  synonym returns NULL, so ALTER TABLE dbo.Runs raises SQL 4909
  ("Cannot alter 'dbo.Runs' because it is not a table"). DDL targets the physical table
  (dbo.Reviews first, pre-295 dbo.Runs fallback) via sp_executesql.
*/

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Architectures
    (
        ArchitectureId           UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_Architectures PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId               UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId            UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId         UNIQUEIDENTIFIER NOT NULL,
        CurrentModelId         NVARCHAR(128)    NULL,
        LatestSealedManifestId UNIQUEIDENTIFIER NULL,
        CreatedUtc             DATETIME2(7)     NOT NULL
            CONSTRAINT DF_Architectures_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc             DATETIME2(7)     NOT NULL
            CONSTRAINT DF_Architectures_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Architectures_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE INDEX IX_Architectures_Scope_UpdatedUtc
        ON dbo.Architectures (TenantId, WorkspaceId, ScopeProjectId, UpdatedUtc DESC);
END;
GO

/* Filtered index requires QUOTED_IDENTIFIER ON. SqlClient defaults it on; sqlcmd defaults it off. */
SET QUOTED_IDENTIFIER ON;
GO

DECLARE @runTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @sql NVARCHAR(MAX);

IF @runTable IS NOT NULL
BEGIN
    IF COL_LENGTH(@runTable, N'ArchitectureId') IS NULL
    BEGIN
        SET @sql = N'ALTER TABLE ' + @runTable + N' ADD ArchitectureId UNIQUEIDENTIFIER NULL;';

        EXEC sp_executesql @sql;
    END

    IF COL_LENGTH(@runTable, N'ArchitectureId') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM sys.indexes
           WHERE name = N'IX_Runs_ArchitectureId'
             AND object_id = OBJECT_ID(@runTable))
    BEGIN
        SET @sql = N'
            CREATE INDEX IX_Runs_ArchitectureId
                ON ' + @runTable + N' (TenantId, WorkspaceId, ScopeProjectId, ArchitectureId)
                WHERE ArchitectureId IS NOT NULL;';

        EXEC sp_executesql @sql;
    END
END
GO
