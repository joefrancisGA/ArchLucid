/*
  414: Identifier association from a verified remediation instance to the inventory snapshot and control (SN-HAND-05).
  No snapshot payload and no verification JSON.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.VerifiedRemediationControlAssociations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VerifiedRemediationControlAssociations
    (
        AssociationId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_VerifiedRemediationControlAssociations PRIMARY KEY CLUSTERED,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId             UNIQUEIDENTIFIER NOT NULL,
        ProjectId               UNIQUEIDENTIFIER NOT NULL,
        InstanceId              UNIQUEIDENTIFIER NOT NULL,
        VerificationSnapshotId  UNIQUEIDENTIFIER NOT NULL,
        ControlId               UNIQUEIDENTIFIER NOT NULL,
        AssessmentId            UNIQUEIDENTIFIER NULL,
        CreatedUtc              DATETIME2        NOT NULL,
        UpdatedUtc              DATETIME2        NOT NULL,
        CONSTRAINT FK_VerifiedRemediationControlAssociations_Instance
            FOREIGN KEY (InstanceId) REFERENCES dbo.RemediationInstances (InstanceId),
        CONSTRAINT FK_VerifiedRemediationControlAssociations_InventorySnapshot
            FOREIGN KEY (VerificationSnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId),
        CONSTRAINT UQ_VerifiedRemediationControlAssociations_Tenant_Instance_Snapshot_Control
            UNIQUE (TenantId, InstanceId, VerificationSnapshotId, ControlId)
    );

    CREATE NONCLUSTERED INDEX IX_VerifiedRemediationControlAssociations_Tenant_Control_Snapshot
        ON dbo.VerifiedRemediationControlAssociations (TenantId, ControlId, VerificationSnapshotId);

    CREATE NONCLUSTERED INDEX IX_VerifiedRemediationControlAssociations_Tenant_Instance
        ON dbo.VerifiedRemediationControlAssociations (TenantId, InstanceId);
END;
GO
