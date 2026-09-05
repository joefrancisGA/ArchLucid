/*
  351: Audit control evaluations and evidence items (AE-03).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AuditControlEvaluations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditControlEvaluations
    (
        EvaluationId        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditControlEvaluations PRIMARY KEY CLUSTERED,
        ControlId           UNIQUEIDENTIFIER NOT NULL,
        FrameworkId         UNIQUEIDENTIFIER NOT NULL,
        SnapshotId          UNIQUEIDENTIFIER NOT NULL,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        Outcome             INT               NOT NULL,
        PassCount           INT               NOT NULL,
        ApplicableCount     INT               NOT NULL,
        Confidence          DECIMAL(5, 4)     NOT NULL,
        EvaluationText      NVARCHAR(MAX)     NOT NULL,
        Formula             NVARCHAR(2000)    NOT NULL,
        RequirementIdsJson  NVARCHAR(MAX)     NOT NULL,
        ExceptionIdsJson    NVARCHAR(MAX)     NOT NULL,
        ProvenanceKind      INT               NOT NULL,
        HumanDisposition    NVARCHAR(256)     NULL,
        Notes               NVARCHAR(2000)    NULL,
        CreatedUtc          DATETIME2         NOT NULL,
        CONSTRAINT FK_AuditControlEvaluations_Controls FOREIGN KEY (ControlId) REFERENCES dbo.AuditControls (ControlId),
        CONSTRAINT FK_AuditControlEvaluations_Frameworks FOREIGN KEY (FrameworkId) REFERENCES dbo.AuditFrameworks (FrameworkId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditControlEvaluations_Tenant_Control_Snapshot
        ON dbo.AuditControlEvaluations (TenantId, ControlId, SnapshotId, CreatedUtc DESC);
END;
GO

IF OBJECT_ID(N'dbo.AuditEvidenceItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditEvidenceItems
    (
        EvidenceItemId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditEvidenceItems PRIMARY KEY CLUSTERED,
        EvaluationId        UNIQUEIDENTIFIER NOT NULL,
        RequirementId       UNIQUEIDENTIFIER NOT NULL,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        CloudResourceId     UNIQUEIDENTIFIER NULL,
        AzureResourceId     NVARCHAR(1024)    NULL,
        EvidenceType        NVARCHAR(128)     NOT NULL,
        Summary             NVARCHAR(2000)    NOT NULL,
        CollectionStatus    INT               NOT NULL,
        ProvenanceKind      INT               NOT NULL,
        CreatedUtc          DATETIME2         NOT NULL,
        CONSTRAINT FK_AuditEvidenceItems_Evaluations FOREIGN KEY (EvaluationId) REFERENCES dbo.AuditControlEvaluations (EvaluationId),
        CONSTRAINT FK_AuditEvidenceItems_Requirements FOREIGN KEY (RequirementId) REFERENCES dbo.AuditEvidenceRequirements (RequirementId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditEvidenceItems_Tenant_Evaluation
        ON dbo.AuditEvidenceItems (TenantId, EvaluationId);
END;
GO
