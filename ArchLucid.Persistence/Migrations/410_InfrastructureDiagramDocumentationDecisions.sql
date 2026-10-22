/*
  410: Operator documentation decisions for diagram reconciliation gaps (RTA-03).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.InfrastructureDiagramDocumentationDecisions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.InfrastructureDiagramDocumentationDecisions
    (
        DecisionId       UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_InfrastructureDiagramDocumentationDecisions PRIMARY KEY CLUSTERED,
        TenantId         UNIQUEIDENTIFIER NOT NULL,
        ScopeId          UNIQUEIDENTIFIER NOT NULL,
        SnapshotId       UNIQUEIDENTIFIER NOT NULL,
        SubjectKind      NVARCHAR(64)     NOT NULL,
        SubjectKey       NVARCHAR(512)    NOT NULL,
        Decision         NVARCHAR(64)     NOT NULL,
        EvidenceFingerprint NVARCHAR(1024) NOT NULL,
        SavedByUserOid   NVARCHAR(128)    NULL,
        CreatedUtc       DATETIME2        NOT NULL,
        UpdatedUtc       DATETIME2        NOT NULL,
        CONSTRAINT UQ_InfrastructureDiagramDocumentationDecisions_Tenant_Scope_Subject
            UNIQUE (TenantId, ScopeId, SubjectKind, SubjectKey)
    );

    CREATE NONCLUSTERED INDEX IX_InfrastructureDiagramDocumentationDecisions_Tenant_Scope
        ON dbo.InfrastructureDiagramDocumentationDecisions (TenantId, ScopeId);
END;
GO
