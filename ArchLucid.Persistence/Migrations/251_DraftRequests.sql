/*
  251: Mutable Socratic intake drafts (ADR 0048).

  RLS: not applied — tenant/workspace/project scope enforced in repository queries and API scope provider.
*/
IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DraftRequests
    (
        DraftId          UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_DraftRequests PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId         UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId      UNIQUEIDENTIFIER NOT NULL,
        ProjectId        UNIQUEIDENTIFIER NOT NULL,
        CreatedByUserId  NVARCHAR(256)    NOT NULL,
        Status           NVARCHAR(32)     NOT NULL,
        DocumentJson     NVARCHAR(MAX)    NOT NULL,
        RedirectReason   NVARCHAR(MAX)    NULL,
        SpawnedRunId     NVARCHAR(64)     NULL,
        CreatedUtc       DATETIME2(7)     NOT NULL
            CONSTRAINT DF_DraftRequests_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc       DATETIME2(7)     NOT NULL
            CONSTRAINT DF_DraftRequests_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_DraftRequests_DocumentJson CHECK (ISJSON(DocumentJson) = 1),
        CONSTRAINT CK_DraftRequests_Status CHECK (Status IN (
            N'Drafting', N'Admitted', N'Submitted', N'RunSpawned', N'Redirected', N'Abandoned')),
        CONSTRAINT FK_DraftRequests_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE INDEX IX_DraftRequests_Scope_Status_UpdatedUtc
        ON dbo.DraftRequests (TenantId, WorkspaceId, ProjectId, Status, UpdatedUtc DESC);
END;
GO
