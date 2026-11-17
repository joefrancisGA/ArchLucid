/*
  SecureNow distributed collection trigger idempotency claim foundation.
  The unique scoped key arbitrates concurrent replicas. Claim ownership does not
  itself imply that an external Azure Automation job was scheduled.
  Do NOT enable automated re-claims until external operation reconciliation exists.
*/
SET NOCOUNT ON;
GO
IF OBJECT_ID(N'dbo.SecureNowCollectionTriggerClaims', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecureNowCollectionTriggerClaims
    (
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId    UNIQUEIDENTIFIER NOT NULL,
        ProjectId      UNIQUEIDENTIFIER NOT NULL,
        IdempotencyKey NVARCHAR(256) NOT NULL,
        RunId          UNIQUEIDENTIFIER NOT NULL,
        ClaimState     TINYINT NOT NULL,
        CreatedUtc     DATETIME2 NOT NULL CONSTRAINT DF_SecureNowTriggerClaims_Created DEFAULT SYSUTCDATETIME(),
        UpdatedUtc     DATETIME2 NOT NULL CONSTRAINT DF_SecureNowTriggerClaims_Updated DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_SecureNowCollectionTriggerClaims PRIMARY KEY CLUSTERED
            (TenantId, WorkspaceId, ProjectId, IdempotencyKey),
        CONSTRAINT CK_SecureNowCollectionTriggerClaims_State CHECK (ClaimState IN (0, 1, 2))
    );
    CREATE NONCLUSTERED INDEX IX_SecureNowCollectionTriggerClaims_Run
        ON dbo.SecureNowCollectionTriggerClaims (TenantId, WorkspaceId, ProjectId, RunId);
END;
GO
