/*
  399: Operator inferred connection proposals and confirmations (SN-RT-10).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.OperatorInferredConnections', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OperatorInferredConnections
    (
        ConnectionId                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_OperatorInferredConnections PRIMARY KEY CLUSTERED,
        TenantId                    UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId                 UNIQUEIDENTIFIER NOT NULL,
        ProjectId                   UNIQUEIDENTIFIER NOT NULL,
        SnapshotId                  UNIQUEIDENTIFIER NOT NULL,
        Status                      INT               NOT NULL,
        Source                      INT               NOT NULL,
        RuleName                    NVARCHAR(128)     NULL,
        QuestionText                NVARCHAR(2000)    NULL,
        FromArmId                   NVARCHAR(1024)    NULL,
        FromLabel                   NVARCHAR(512)     NULL,
        FromCloudResourceId         UNIQUEIDENTIFIER  NULL,
        ToHost                      NVARCHAR(512)     NULL,
        ToCatalog                   NVARCHAR(256)     NULL,
        ToArmId                     NVARCHAR(1024)    NULL,
        ToCloudResourceId           UNIQUEIDENTIFIER  NULL,
        SettingName                 NVARCHAR(512)     NULL,
        SourceFileFormat            NVARCHAR(64)      NULL,
        ActorKey                    NVARCHAR(256)     NULL,
        ProposalPayloadHashSha256   VARBINARY(32)     NOT NULL,
        CreatedUtc                  DATETIME2         NOT NULL,
        UpdatedUtc                  DATETIME2         NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_OperatorInferredConnections_Tenant_Snapshot_Status
        ON dbo.OperatorInferredConnections (TenantId, SnapshotId, Status);

    CREATE NONCLUSTERED INDEX IX_OperatorInferredConnections_Tenant_Snapshot_Hash
        ON dbo.OperatorInferredConnections (TenantId, SnapshotId, ProposalPayloadHashSha256);
END;
GO
