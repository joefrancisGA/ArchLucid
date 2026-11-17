/*
  421: SecureNow bounded attack-path search coverage.

  A capped search is not evidence of full path coverage. Persist the limit
  reached by each security engine, scoped to the originating snapshot, so
  report consumers can retain explicit unevaluated-path disclosures.

  Additive/idempotent: no backfill or fabricated evidence rows.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathSearchCoverage', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecurityEvidencePathSearchCoverage
    (
        SearchCoverageId  UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_SecurityEvidencePathSearchCoverage PRIMARY KEY CLUSTERED,
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId       UNIQUEIDENTIFIER NOT NULL,
        ProjectId         UNIQUEIDENTIFIER NOT NULL,
        SnapshotId        UNIQUEIDENTIFIER NOT NULL,
        EngineName        NVARCHAR(128)    NOT NULL,
        LimitKind         NVARCHAR(64)     NOT NULL,
        LimitValue        INT              NOT NULL,
        PathsEmitted      INT              NOT NULL,
        CreatedUtc        DATETIME2        NOT NULL,
        CONSTRAINT FK_SecurityEvidencePathSearchCoverage_Snapshots
            FOREIGN KEY (SnapshotId)
            REFERENCES dbo.AzureInventorySnapshots (SnapshotId),
        CONSTRAINT CK_SecurityEvidencePathSearchCoverage_LimitValue
            CHECK (LimitValue >= 0),
        CONSTRAINT CK_SecurityEvidencePathSearchCoverage_PathsEmitted
            CHECK (PathsEmitted >= 0)
    );

    CREATE NONCLUSTERED INDEX IX_SecurityEvidencePathSearchCoverage_Scope_Snapshot_Engine
        ON dbo.SecurityEvidencePathSearchCoverage
            (TenantId, WorkspaceId, ProjectId, SnapshotId, EngineName)
        INCLUDE (LimitKind, LimitValue, PathsEmitted, CreatedUtc);
END;
GO
