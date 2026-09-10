/*
  386: SecureNow architect — constrained AI path explanations (SA-17).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathExplanations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecurityEvidencePathExplanations
    (
        ExplanationId              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SecurityEvidencePathExplanations PRIMARY KEY CLUSTERED,
        PathId                     UNIQUEIDENTIFIER NOT NULL,
        TenantId                   UNIQUEIDENTIFIER NOT NULL,
        ExecutiveSummary           NVARCHAR(MAX)     NOT NULL,
        BusinessImpactHypothesesJson NVARCHAR(MAX)   NOT NULL,
        ProposedRemediationJson    NVARCHAR(MAX)     NOT NULL,
        CitedEvidenceRefsJson      NVARCHAR(MAX)     NOT NULL,
        ProvenanceKind             INT               NOT NULL,
        SimulatorLabel             NVARCHAR(128)     NULL,
        CreatedUtc                 DATETIME2         NOT NULL,
        CONSTRAINT FK_SecurityEvidencePathExplanations_Paths
            FOREIGN KEY (PathId) REFERENCES dbo.SecurityEvidencePaths (PathId)
    );

    CREATE NONCLUSTERED INDEX IX_SecurityEvidencePathExplanations_Tenant_Path
        ON dbo.SecurityEvidencePathExplanations (TenantId, PathId, CreatedUtc DESC);
END;
GO
