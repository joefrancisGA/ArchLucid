/*
  397: Human-declared resource connections for SecureNow (config-not-ingested edges).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityDeclaredConnections', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecurityDeclaredConnections
    (
        ConnectionId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SecurityDeclaredConnections PRIMARY KEY CLUSTERED,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId             UNIQUEIDENTIFIER NOT NULL,
        ProjectId               UNIQUEIDENTIFIER NOT NULL,
        FromCloudResourceId     UNIQUEIDENTIFIER NOT NULL,
        ToCloudResourceId       UNIQUEIDENTIFIER NOT NULL,
        RelationshipType        INT               NOT NULL,
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

    CREATE NONCLUSTERED INDEX IX_SecurityDeclaredConnections_Tenant_Status_Expiration
        ON dbo.SecurityDeclaredConnections (TenantId, Status, ExpirationUtc);

    CREATE NONCLUSTERED INDEX IX_SecurityDeclaredConnections_Tenant_From_To_Type_Status
        ON dbo.SecurityDeclaredConnections (TenantId, FromCloudResourceId, ToCloudResourceId, RelationshipType, Status);
END;
GO
