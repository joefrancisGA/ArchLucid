/*
  350: Audit evidence requirements (AE-02).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AuditEvidenceRequirements', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditEvidenceRequirements
    (
        RequirementId         UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditEvidenceRequirements PRIMARY KEY CLUSTERED,
        ControlId             UNIQUEIDENTIFIER NOT NULL,
        FrameworkId           UNIQUEIDENTIFIER NOT NULL,
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        Name                  NVARCHAR(256)     NOT NULL,
        Description           NVARCHAR(2000)    NULL,
        EvidenceType          NVARCHAR(128)     NOT NULL,
        RequiredAzureScopes   NVARCHAR(512)     NULL,
        RequiredResourceTypes NVARCHAR(512)     NULL,
        CollectionMethod      NVARCHAR(128)     NULL,
        Frequency             NVARCHAR(128)     NULL,
        EvaluationMethod      NVARCHAR(128)     NULL,
        ManualEvidenceAllowed BIT               NOT NULL,
        RequiredFreshness     NVARCHAR(128)     NULL,
        AutomationClass       INT               NOT NULL,
        CONSTRAINT FK_AuditEvidenceRequirements_Controls FOREIGN KEY (ControlId) REFERENCES dbo.AuditControls (ControlId),
        CONSTRAINT FK_AuditEvidenceRequirements_Frameworks FOREIGN KEY (FrameworkId) REFERENCES dbo.AuditFrameworks (FrameworkId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditEvidenceRequirements_Tenant_Framework
        ON dbo.AuditEvidenceRequirements (TenantId, FrameworkId, EvidenceType);
END;
GO
