/*
  388: LW-089 — soft exclusive architecture draft work leases (ADR 0090).
  Tenant catalog only; no SQL RLS. One active lease row per draft (DraftId PK).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.ArchitectureWorkLeases', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArchitectureWorkLeases
    (
        DraftId           UNIQUEIDENTIFIER NOT NULL,
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId       UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId    UNIQUEIDENTIFIER NOT NULL,
        ArchitectureId    UNIQUEIDENTIFIER NOT NULL,
        HolderUserId      UNIQUEIDENTIFIER NOT NULL,
        AcquiredUtc       DATETIME2(7)     NOT NULL
            CONSTRAINT DF_ArchitectureWorkLeases_AcquiredUtc DEFAULT SYSUTCDATETIME(),
        LastHeartbeatUtc  DATETIME2(7)     NOT NULL
            CONSTRAINT DF_ArchitectureWorkLeases_LastHeartbeatUtc DEFAULT SYSUTCDATETIME(),
        ExpiresUtc        DATETIME2(7)     NOT NULL,
        RowVersion        ROWVERSION       NOT NULL,
        CONSTRAINT PK_ArchitectureWorkLeases PRIMARY KEY CLUSTERED (DraftId),
        CONSTRAINT FK_ArchitectureWorkLeases_DraftRequests
            FOREIGN KEY (DraftId) REFERENCES dbo.DraftRequests (DraftId) ON DELETE CASCADE,
        CONSTRAINT FK_ArchitectureWorkLeases_Tenants
            FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        CONSTRAINT FK_ArchitectureWorkLeases_Architectures
            FOREIGN KEY (ArchitectureId) REFERENCES dbo.Architectures (ArchitectureId) ON DELETE CASCADE,
        CONSTRAINT FK_ArchitectureWorkLeases_PlatformUsers
            FOREIGN KEY (HolderUserId) REFERENCES dbo.PlatformUsers (Id)
    );

    CREATE NONCLUSTERED INDEX IX_ArchitectureWorkLeases_ExpiresUtc
        ON dbo.ArchitectureWorkLeases (ExpiresUtc);

    CREATE NONCLUSTERED INDEX IX_ArchitectureWorkLeases_Tenant_Architecture
        ON dbo.ArchitectureWorkLeases (TenantId, ArchitectureId, DraftId);
END;
GO
