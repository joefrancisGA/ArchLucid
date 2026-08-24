/*
  323: First-class architecture identity for cross-run recurrence (tenant-scoped).

  Architectures are mutable identity anchors — not sealed records. Drafts remain DraftRequests.
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

IF COL_LENGTH(N'dbo.Runs', N'ArchitectureId') IS NULL
BEGIN
    ALTER TABLE dbo.Runs ADD ArchitectureId UNIQUEIDENTIFIER NULL;

    CREATE INDEX IX_Runs_ArchitectureId
        ON dbo.Runs (TenantId, WorkspaceId, ScopeProjectId, ArchitectureId)
        WHERE ArchitectureId IS NOT NULL;
END;
GO
