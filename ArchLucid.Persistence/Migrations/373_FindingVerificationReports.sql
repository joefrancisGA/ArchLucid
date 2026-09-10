/*
  373: DX-19 / TB-2033 — append-only finding verification reports (ADR 0062 slice 1).
*/

IF OBJECT_ID(N'dbo.FindingVerificationResults', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.FindingVerificationResults;
END;
GO

IF OBJECT_ID(N'dbo.FindingVerificationReports', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingVerificationReports
    (
        ReportId                       UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_FindingVerificationReports PRIMARY KEY,
        TenantId                       UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId                    UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId                 UNIQUEIDENTIFIER NOT NULL,
        RunId                          UNIQUEIDENTIFIER NOT NULL,
        SourceManifestHash             NVARCHAR(128)    NOT NULL,
        SourceFindingsSnapshotId       UNIQUEIDENTIFIER NOT NULL,
        VerificationFindingsSnapshotId UNIQUEIDENTIFIER NULL,
        ReportHash                     NVARCHAR(128)    NOT NULL,
        TriggeredByUserId              NVARCHAR(256)    NOT NULL,
        CreatedUtc                     DATETIME2(7)     NOT NULL CONSTRAINT DF_FindingVerificationReports_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_FindingVerificationReports_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_FindingVerificationReports_Scope_Run_Created
        ON dbo.FindingVerificationReports (TenantId, WorkspaceId, ScopeProjectId, RunId, CreatedUtc DESC);
END;
GO

IF OBJECT_ID(N'dbo.FindingVerificationResults', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingVerificationResults
    (
        ResultId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_FindingVerificationResults PRIMARY KEY,
        ReportId   UNIQUEIDENTIFIER NOT NULL,
        FindingId  NVARCHAR(64)     NOT NULL,
        Status     TINYINT          NOT NULL,
        TraceText  NVARCHAR(2000)   NOT NULL,
        CONSTRAINT CK_FindingVerificationResults_Status CHECK (Status IN (0, 1, 2, 3)),
        CONSTRAINT FK_FindingVerificationResults_Reports FOREIGN KEY (ReportId)
            REFERENCES dbo.FindingVerificationReports (ReportId),
        CONSTRAINT UQ_FindingVerificationResults_Report_Finding UNIQUE (ReportId, FindingId)
    );

    CREATE NONCLUSTERED INDEX IX_FindingVerificationResults_Report
        ON dbo.FindingVerificationResults (ReportId, FindingId);
END;
GO
