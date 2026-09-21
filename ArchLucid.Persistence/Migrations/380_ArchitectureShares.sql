/*
  380: AS-087 — optional architecture-scoped sharing (ADR 0087 / restrict-to-shares).
  Tenant catalog only; no SQL RLS. Default RestrictToShares = 0 (workspace-visible grandfather).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Architectures', N'RestrictToShares') IS NULL
BEGIN
    ALTER TABLE dbo.Architectures
        ADD RestrictToShares BIT NOT NULL
            CONSTRAINT DF_Architectures_RestrictToShares DEFAULT (0);
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArchitectureShares
    (
        ArchitectureId UNIQUEIDENTIFIER NOT NULL,
        ActorOid         NVARCHAR(256)    NOT NULL,
        TenantId         UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId      UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId   UNIQUEIDENTIFIER NOT NULL,
        Role             NVARCHAR(16)     NOT NULL,
        GrantedBy          NVARCHAR(128)    NOT NULL,
        GrantedUtc         DATETIME2(7)     NOT NULL
            CONSTRAINT DF_ArchitectureShares_GrantedUtc DEFAULT SYSUTCDATETIME(),
        RowVersion         ROWVERSION       NOT NULL,
        CONSTRAINT PK_ArchitectureShares PRIMARY KEY CLUSTERED (ArchitectureId, ActorOid),
        CONSTRAINT FK_ArchitectureShares_Architectures
            FOREIGN KEY (ArchitectureId) REFERENCES dbo.Architectures (ArchitectureId) ON DELETE CASCADE,
        CONSTRAINT CK_ArchitectureShares_Role CHECK (Role IN (N'View', N'Decide', N'Admin'))
    );

    CREATE NONCLUSTERED INDEX IX_ArchitectureShares_ActorOid
        ON dbo.ArchitectureShares (ActorOid);

    CREATE NONCLUSTERED INDEX IX_ArchitectureShares_Scope_Architecture
        ON dbo.ArchitectureShares (TenantId, WorkspaceId, ScopeProjectId, ArchitectureId);
END;
GO
