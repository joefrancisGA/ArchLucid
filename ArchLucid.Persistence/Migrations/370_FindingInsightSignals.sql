/*
  370: DX-13 — append-only operator insight-density signals on the finding desk.

  Does not mutate sealed FindingRecords classification; mute remains separate.
*/

IF OBJECT_ID(N'dbo.FindingInsightSignals', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingInsightSignals
    (
        SignalId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_FindingInsightSignals PRIMARY KEY,
        TenantId   UNIQUEIDENTIFIER NOT NULL,
        RunId      UNIQUEIDENTIFIER NOT NULL,
        FindingId  NVARCHAR(64)     NOT NULL,
        UserId     NVARCHAR(256)    NOT NULL,
        Kind       TINYINT          NOT NULL,
        CreatedUtc DATETIME2(7)     NOT NULL CONSTRAINT DF_FindingInsightSignals_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_FindingInsightSignals_Kind CHECK (Kind IN (0, 1, 2)),
        CONSTRAINT FK_FindingInsightSignals_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        CONSTRAINT UQ_FindingInsightSignals_Scope_User_Kind UNIQUE (TenantId, RunId, FindingId, UserId, Kind)
    );

    CREATE NONCLUSTERED INDEX IX_FindingInsightSignals_Tenant_Run
        ON dbo.FindingInsightSignals (TenantId, RunId, CreatedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_FindingInsightSignals_Tenant_Run_Finding
        ON dbo.FindingInsightSignals (TenantId, RunId, FindingId);
END;
GO
