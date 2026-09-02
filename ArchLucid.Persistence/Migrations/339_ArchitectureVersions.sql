/*
  339: Architecture version lattice — immutable content-addressed revisions per architecture identity.

  Each review pins ArchitectureVersionId so re-review and comparison can prove which revision was evaluated.
*/

IF OBJECT_ID(N'dbo.ArchitectureVersions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArchitectureVersions
    (
        ArchitectureVersionId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_ArchitectureVersions PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        ArchitectureId        UNIQUEIDENTIFIER NOT NULL,
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId           UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId        UNIQUEIDENTIFIER NOT NULL,
        VersionNumber         INT              NOT NULL,
        ContentHashSha256     VARBINARY(32)    NOT NULL,
        SourceRequestId       NVARCHAR(64)     NULL,
        CreatedUtc            DATETIME2(7)     NOT NULL
            CONSTRAINT DF_ArchitectureVersions_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ArchitectureVersions_Architectures
            FOREIGN KEY (ArchitectureId) REFERENCES dbo.Architectures (ArchitectureId),
        CONSTRAINT UQ_ArchitectureVersions_Architecture_VersionNumber
            UNIQUE (ArchitectureId, VersionNumber),
        CONSTRAINT UQ_ArchitectureVersions_Architecture_ContentHash
            UNIQUE (ArchitectureId, ContentHashSha256)
    );

    CREATE INDEX IX_ArchitectureVersions_Scope_Architecture
        ON dbo.ArchitectureVersions (TenantId, WorkspaceId, ScopeProjectId, ArchitectureId, VersionNumber DESC);
END;
GO

DECLARE @runTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @sql NVARCHAR(MAX);

IF @runTable IS NOT NULL
BEGIN
    IF COL_LENGTH(@runTable, N'ArchitectureVersionId') IS NULL
    BEGIN
        SET @sql = N'ALTER TABLE ' + @runTable + N' ADD ArchitectureVersionId UNIQUEIDENTIFIER NULL;';

        EXEC sp_executesql @sql;
    END

    IF COL_LENGTH(@runTable, N'ArchitectureVersionId') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM sys.indexes
           WHERE name = N'IX_Runs_ArchitectureVersionId'
             AND object_id = OBJECT_ID(@runTable))
    BEGIN
        SET @sql = N'
            CREATE INDEX IX_Runs_ArchitectureVersionId
                ON ' + @runTable + N' (TenantId, WorkspaceId, ScopeProjectId, ArchitectureVersionId)
                WHERE ArchitectureVersionId IS NOT NULL;';

        EXEC sp_executesql @sql;
    END
END
GO
