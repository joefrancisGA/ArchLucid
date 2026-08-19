SET NOCOUNT ON;
GO

/*
  142: Optional pilot closeout rows (proof-of-ROI questionnaire) at tenant/workspace/project scope.
  RLS: triple scope; application INSERT under session context (Core Pilot checklist pattern).
*/

SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.PilotCloseouts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PilotCloseouts
    (
        CloseoutId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PilotCloseouts PRIMARY KEY,
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId           UNIQUEIDENTIFIER NOT NULL,
        ProjectId             UNIQUEIDENTIFIER NOT NULL,
        RunId                 UNIQUEIDENTIFIER     NULL,
        BaselineHours         DECIMAL(12, 2)       NULL,
        SpeedScore            TINYINT          NOT NULL,
        ManifestPackageScore  TINYINT          NOT NULL,
        TraceabilityScore     TINYINT          NOT NULL,
        Notes                 NVARCHAR(2000)       NULL,
        CreatedUtc            DATETIME2(7)     NOT NULL CONSTRAINT DF_PilotCloseouts_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_PilotCloseouts_Scores CHECK (
            SpeedScore BETWEEN 1 AND 5
            AND ManifestPackageScore BETWEEN 1 AND 5
            AND TraceabilityScore BETWEEN 1 AND 5),
        CONSTRAINT FK_PilotCloseouts_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_PilotCloseouts_Scope_CreatedUtc
        ON dbo.PilotCloseouts (TenantId, WorkspaceId, ProjectId, CreatedUtc DESC);
END;
GO


IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'ArchLucidApp')
   AND OBJECT_ID(N'dbo.PilotCloseouts', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.database_permissions AS dp
        WHERE dp.major_id = OBJECT_ID(N'dbo.PilotCloseouts')
          AND dp.grantee_principal_id = DATABASE_PRINCIPAL_ID(N'ArchLucidApp')
          AND dp.permission_name = N'SELECT')
BEGIN
    GRANT SELECT, INSERT ON dbo.PilotCloseouts TO [ArchLucidApp];
END;
GO
