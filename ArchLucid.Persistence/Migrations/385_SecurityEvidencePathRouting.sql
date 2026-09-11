/*
  385: SecureNow architect — path organizational routing (SA-15).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathRouting', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecurityEvidencePathRouting
    (
        RoutingRowId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SecurityEvidencePathRouting PRIMARY KEY CLUSTERED,
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        PathId            UNIQUEIDENTIFIER NOT NULL,
        FindingId         UNIQUEIDENTIFIER NULL,
        RoutingRole       INT               NOT NULL,
        PrincipalId       NVARCHAR(256)     NULL,
        DisplayName       NVARCHAR(512)     NULL,
        ProvenanceKind    INT               NOT NULL,
        SourceReference   NVARCHAR(512)     NOT NULL,
        CreatedUtc        DATETIME2         NOT NULL,
        UpdatedUtc        DATETIME2         NOT NULL,
        CONSTRAINT FK_SecurityEvidencePathRouting_Paths
            FOREIGN KEY (PathId) REFERENCES dbo.SecurityEvidencePaths (PathId),
        CONSTRAINT FK_SecurityEvidencePathRouting_Findings
            FOREIGN KEY (FindingId) REFERENCES dbo.OperationalSecurityFindings (FindingId),
        CONSTRAINT UQ_SecurityEvidencePathRouting_Tenant_Path_Role
            UNIQUE (TenantId, PathId, RoutingRole)
    );

    CREATE NONCLUSTERED INDEX IX_SecurityEvidencePathRouting_Tenant_Path
        ON dbo.SecurityEvidencePathRouting (TenantId, PathId, RoutingRole);
END;
GO
