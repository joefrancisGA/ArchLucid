/*
  387: Human security asset assertions (SA-18).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityAssetAssertions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecurityAssetAssertions
    (
        AssertionId             UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SecurityAssetAssertions PRIMARY KEY CLUSTERED,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId             UNIQUEIDENTIFIER NOT NULL,
        ProjectId               UNIQUEIDENTIFIER NOT NULL,
        CloudResourceId         UNIQUEIDENTIFIER NOT NULL,
        DataSensitivity         INT               NOT NULL,
        RegulatoryClass         INT               NOT NULL,
        DeploymentEnvironment   INT               NOT NULL,
        BusinessCriticality     INT               NOT NULL,
        IsRevenueImpact         BIT               NOT NULL CONSTRAINT DF_SecurityAssetAssertions_IsRevenueImpact DEFAULT (0),
        IsPatientImpact         BIT               NOT NULL CONSTRAINT DF_SecurityAssetAssertions_IsPatientImpact DEFAULT (0),
        Rationale               NVARCHAR(4000)    NOT NULL,
        EvidenceReference       NVARCHAR(1024)    NULL,
        ExpirationUtc           DATETIME2         NOT NULL,
        Status                  INT               NOT NULL,
        RequestedByActorKey     NVARCHAR(256)     NOT NULL,
        ApprovedByActorKey      NVARCHAR(256)     NOT NULL,
        PayloadHashSha256       VARBINARY(32)     NOT NULL,
        ExpiryProcessedUtc      DATETIME2         NULL,
        CreatedUtc              DATETIME2         NOT NULL,
        UpdatedUtc              DATETIME2         NOT NULL,
        RevokedUtc              DATETIME2         NULL,
        RevokedByActorKey       NVARCHAR(256)     NULL
    );

    CREATE NONCLUSTERED INDEX IX_SecurityAssetAssertions_Tenant_Status_Expiration
        ON dbo.SecurityAssetAssertions (TenantId, Status, ExpirationUtc);

    CREATE NONCLUSTERED INDEX IX_SecurityAssetAssertions_Tenant_CloudResource_Status
        ON dbo.SecurityAssetAssertions (TenantId, CloudResourceId, Status);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'FK_SecurityEvidencePaths_CrownJewelAssertion')
BEGIN
    ALTER TABLE dbo.SecurityEvidencePaths
        ADD CONSTRAINT FK_SecurityEvidencePaths_CrownJewelAssertion
            FOREIGN KEY (CrownJewelAssertionId) REFERENCES dbo.SecurityAssetAssertions (AssertionId);
END;
GO
