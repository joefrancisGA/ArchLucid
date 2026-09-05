/*
  354: Audit control technical timeline states (AE-09).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AuditControlTechnicalTimelineStates', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditControlTechnicalTimelineStates
    (
        TimelineStateId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditControlTechnicalTimelineStates PRIMARY KEY CLUSTERED,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        AssessmentId        UNIQUEIDENTIFIER NOT NULL,
        ControlId           UNIQUEIDENTIFIER NOT NULL,
        State               INT               NOT NULL,
        InventoryDiffId     UNIQUEIDENTIFIER NULL,
        UpdatedUtc          DATETIME2         NOT NULL,
        CONSTRAINT FK_AuditControlTechnicalTimelineStates_Assessments FOREIGN KEY (AssessmentId) REFERENCES dbo.AuditAssessments (AssessmentId),
        CONSTRAINT FK_AuditControlTechnicalTimelineStates_Controls FOREIGN KEY (ControlId) REFERENCES dbo.AuditControls (ControlId)
    );

    CREATE UNIQUE NONCLUSTERED INDEX UQ_AuditControlTechnicalTimelineStates_Tenant_Assessment_Control
        ON dbo.AuditControlTechnicalTimelineStates (TenantId, AssessmentId, ControlId);

    CREATE NONCLUSTERED INDEX IX_AuditControlTechnicalTimelineStates_Tenant_Updated
        ON dbo.AuditControlTechnicalTimelineStates (TenantId, UpdatedUtc DESC);
END;
GO
