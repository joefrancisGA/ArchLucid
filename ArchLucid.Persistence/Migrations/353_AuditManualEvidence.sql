/*
  353: Human-submitted audit evidence and architecture evidence links (AE-07).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AuditManualEvidenceSubmissions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditManualEvidenceSubmissions
    (
        SubmissionId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditManualEvidenceSubmissions PRIMARY KEY CLUSTERED,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        AssessmentId            UNIQUEIDENTIFIER NOT NULL,
        ControlId               UNIQUEIDENTIFIER NOT NULL,
        RequirementId           UNIQUEIDENTIFIER NOT NULL,
        Owner                   NVARCHAR(256)     NOT NULL,
        SubmittedBy             NVARCHAR(256)     NOT NULL,
        SubmittedUtc            DATETIME2         NOT NULL,
        ApplicablePeriodStartUtc DATETIME2        NULL,
        ApplicablePeriodEndUtc  DATETIME2         NULL,
        ExpirationUtc           DATETIME2         NULL,
        DocumentVersion         NVARCHAR(128)     NULL,
        DocumentKind            NVARCHAR(128)     NOT NULL,
        EvidenceHashSha256      VARBINARY(32)     NOT NULL,
        BlobPointer             NVARCHAR(1024)    NOT NULL,
        ReviewStatus            INT               NOT NULL,
        ProvenanceKind          INT               NOT NULL,
        ItsmProvider            NVARCHAR(64)      NULL,
        ItsmExternalKey         NVARCHAR(256)     NULL,
        CONSTRAINT FK_AuditManualEvidenceSubmissions_Assessments FOREIGN KEY (AssessmentId) REFERENCES dbo.AuditAssessments (AssessmentId),
        CONSTRAINT FK_AuditManualEvidenceSubmissions_Requirements FOREIGN KEY (RequirementId) REFERENCES dbo.AuditEvidenceRequirements (RequirementId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditManualEvidenceSubmissions_Tenant_Assessment
        ON dbo.AuditManualEvidenceSubmissions (TenantId, AssessmentId, SubmittedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_AuditManualEvidenceSubmissions_Tenant_Control
        ON dbo.AuditManualEvidenceSubmissions (TenantId, AssessmentId, ControlId);
END;
GO

IF OBJECT_ID(N'dbo.AuditArchitectureEvidenceLinks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditArchitectureEvidenceLinks
    (
        LinkId                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditArchitectureEvidenceLinks PRIMARY KEY CLUSTERED,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        AssessmentId            UNIQUEIDENTIFIER NOT NULL,
        ControlId               UNIQUEIDENTIFIER NOT NULL,
        RequirementId           UNIQUEIDENTIFIER NOT NULL,
        RunId                   UNIQUEIDENTIFIER NOT NULL,
        GoldenManifestId        UNIQUEIDENTIFIER NOT NULL,
        LinkedBy                NVARCHAR(256)     NOT NULL,
        LinkedUtc               DATETIME2         NOT NULL,
        CONSTRAINT FK_AuditArchitectureEvidenceLinks_Assessments FOREIGN KEY (AssessmentId) REFERENCES dbo.AuditAssessments (AssessmentId),
        CONSTRAINT FK_AuditArchitectureEvidenceLinks_Requirements FOREIGN KEY (RequirementId) REFERENCES dbo.AuditEvidenceRequirements (RequirementId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditArchitectureEvidenceLinks_Tenant_Assessment
        ON dbo.AuditArchitectureEvidenceLinks (TenantId, AssessmentId, LinkedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_AuditArchitectureEvidenceLinks_Tenant_Control
        ON dbo.AuditArchitectureEvidenceLinks (TenantId, AssessmentId, ControlId);
END;
GO
