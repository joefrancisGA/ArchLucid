/*
  354: FND-010 append-only authorization decision journal.
  Deployment requires restricted INSERT-only application grants and independent
  migration-owner permissions. SQL Server durability depends on configured HA/backups.
*/
SET NOCOUNT ON;
GO
IF OBJECT_ID(N'dbo.AuthorizationDecisionJournal', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuthorizationDecisionJournal
    (
        DecisionId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_AuthorizationDecisionJournal PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        ResourceId UNIQUEIDENTIFIER NOT NULL,
        ActionName NVARCHAR(128) NOT NULL,
        Allowed BIT NOT NULL,
        ReasonCode NVARCHAR(128) NOT NULL,
        CallerKind NVARCHAR(64) NOT NULL,
        OccurredUtc DATETIMEOFFSET(7) NOT NULL,
        RecordedUtc DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_AuthorizationDecisionJournal_RecordedUtc DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_AuthorizationDecisionJournal_TenantTime
        ON dbo.AuthorizationDecisionJournal(TenantId, OccurredUtc DESC);
END;
GO
-- Defensive immutability for normal DML; database owners can still modify data.
CREATE OR ALTER TRIGGER dbo.TR_AuthorizationDecisionJournal_NoMutation
ON dbo.AuthorizationDecisionJournal
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 51054, 'Authorization decision journal is append-only.', 1;
END;
GO
