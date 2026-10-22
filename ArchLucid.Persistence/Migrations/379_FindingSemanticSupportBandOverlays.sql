/*
  379: AS-060 — per-finding semantic support band overlay (ADR 0085 / ADR 0039).
  Post-commit rescoring updates this table only; sealed FindingRecords prose stays immutable.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.FindingSemanticSupportBandOverlays', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingSemanticSupportBandOverlays
    (
        FindingsSnapshotId        UNIQUEIDENTIFIER NOT NULL,
        FindingId                 NVARCHAR(200)    NOT NULL,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId               UNIQUEIDENTIFIER NOT NULL,
        ProjectId                 UNIQUEIDENTIFIER NOT NULL,
        SemanticSupportBand       NVARCHAR(32)     NOT NULL,
        ScorerVersion             NVARCHAR(64)     NOT NULL,
        EvidenceExcerptHashSha256 NVARCHAR(64)     NULL,
        ScoredAtUtc               DATETIME2(7)     NOT NULL
            CONSTRAINT DF_FindingSemanticSupportBandOverlays_ScoredAtUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc                DATETIME2(7)     NOT NULL
            CONSTRAINT DF_FindingSemanticSupportBandOverlays_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        FrozenAtUtc               DATETIME2(7)     NULL,
        CONSTRAINT PK_FindingSemanticSupportBandOverlays
            PRIMARY KEY CLUSTERED (FindingsSnapshotId, FindingId),
        CONSTRAINT FK_FindingSemanticSupportBandOverlays_FindingRecords
            FOREIGN KEY (FindingsSnapshotId, FindingId)
            REFERENCES dbo.FindingRecords (FindingsSnapshotId, FindingId)
            ON DELETE CASCADE,
        CONSTRAINT CK_FindingSemanticSupportBandOverlays_Band CHECK (SemanticSupportBand IN (
            N'Supported', N'Unchecked', N'Unsupported', N'NotScored'))
    );

    CREATE NONCLUSTERED INDEX IX_FindingSemanticSupportBandOverlays_Scope
        ON dbo.FindingSemanticSupportBandOverlays (TenantId, WorkspaceId, ProjectId, FindingsSnapshotId);
END;
GO
