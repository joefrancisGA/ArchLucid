/*
  389: IE-HOTFIX — Defender secure-score companion rows for inventory snapshots.
  Read path in SqlAzureInventorySnapshotRepository.TryGetSnapshotDetailAsync always SELECTs this table.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderSummaries', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDefenderSummaries
    (
        DefenderSummaryRowId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDefenderSummaries PRIMARY KEY CLUSTERED,
        SnapshotId                UNIQUEIDENTIFIER NOT NULL,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        ResourceId                NVARCHAR(1024)    NOT NULL,
        SecureScore               INT               NOT NULL,
        SourceEvidenceReference   NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDefenderSummaries_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDefenderSummaries_Tenant_Snapshot
        ON dbo.AzureInventoryDefenderSummaries (TenantId, SnapshotId);
END;
GO
