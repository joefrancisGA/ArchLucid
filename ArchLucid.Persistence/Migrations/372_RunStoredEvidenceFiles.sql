/*
  372 — ESI-01: catalog rows for bulk-uploaded review evidence files (blob pointers + metadata).
*/

IF OBJECT_ID(N'dbo.RunStoredEvidenceFiles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RunStoredEvidenceFiles
    (
        EvidenceItemId   NVARCHAR(32)     NOT NULL CONSTRAINT PK_RunStoredEvidenceFiles PRIMARY KEY CLUSTERED,
        TenantId         UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId      UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId   UNIQUEIDENTIFIER NOT NULL,
        RunId            UNIQUEIDENTIFIER NOT NULL,
        OriginalFileName NVARCHAR(500)    NOT NULL,
        ContentType      NVARCHAR(128)    NOT NULL,
        ByteLength       BIGINT           NOT NULL,
        BlobUri          NVARCHAR(2048)   NOT NULL,
        CreatedUtc       DATETIME2        NOT NULL,
        ActorUserId      NVARCHAR(256)    NOT NULL,
        CONSTRAINT CK_RunStoredEvidenceFiles_ByteLength CHECK (ByteLength >= 0)
    );

    CREATE NONCLUSTERED INDEX IX_RunStoredEvidenceFiles_Scope_Run_Created
        ON dbo.RunStoredEvidenceFiles (TenantId, WorkspaceId, ScopeProjectId, RunId, CreatedUtc);
END;
GO
