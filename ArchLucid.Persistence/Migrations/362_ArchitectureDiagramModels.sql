/*
  362: Architecture diagram structured ingest (IE-18).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.ArchitectureDiagramModels', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArchitectureDiagramModels
    (
        DiagramModelId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ArchitectureDiagramModels PRIMARY KEY CLUSTERED,
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        RunId             UNIQUEIDENTIFIER NOT NULL,
        ModelJson         NVARCHAR(MAX)     NOT NULL,
        ExtractionMethod  NVARCHAR(64)      NOT NULL,
        WarningsJson      NVARCHAR(MAX)     NULL,
        CreatedUtc        DATETIME2         NOT NULL,
        UpdatedUtc        DATETIME2         NOT NULL,
        CONSTRAINT UQ_ArchitectureDiagramModels_Tenant_Run UNIQUE (TenantId, RunId)
    );

    CREATE NONCLUSTERED INDEX IX_ArchitectureDiagramModels_Tenant_Run
        ON dbo.ArchitectureDiagramModels (TenantId, RunId);
END;
GO
