/*
  407: Advisory diagram-to-inventory comparisons (DIC-01).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.InfrastructureDiagramComparisons', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.InfrastructureDiagramComparisons
    (
        ComparisonId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_InfrastructureDiagramComparisons PRIMARY KEY CLUSTERED,
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        SnapshotId     UNIQUEIDENTIFIER NOT NULL,
        SourcesJson    NVARCHAR(MAX)     NOT NULL,
        ResultJson     NVARCHAR(MAX)     NOT NULL,
        CreatedUtc     DATETIME2         NOT NULL,
        UpdatedUtc     DATETIME2         NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_InfrastructureDiagramComparisons_Tenant_Snapshot
        ON dbo.InfrastructureDiagramComparisons (TenantId, SnapshotId);
END;
GO
