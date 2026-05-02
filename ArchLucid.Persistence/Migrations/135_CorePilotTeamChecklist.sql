/*
  DbUp 135: Team-visible Core Pilot checklist (four milestones) at tenant/workspace/project scope.
  RLS: triple scope. Application INSERT/UPDATE under session context (same pattern as ProductFeedback).
*/

SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.CorePilotTeamChecklist', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CorePilotTeamChecklist
    (
        TenantId    UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId   UNIQUEIDENTIFIER NOT NULL,
        StepIndex   TINYINT          NOT NULL,
        IsCompleted BIT              NOT NULL CONSTRAINT DF_CorePilotTeamChecklist_IsCompleted DEFAULT (0),
        UpdatedUtc  DATETIME2(7)     NOT NULL CONSTRAINT DF_CorePilotTeamChecklist_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedByUserId NVARCHAR(256) NULL,
        CONSTRAINT PK_CorePilotTeamChecklist PRIMARY KEY CLUSTERED (TenantId, WorkspaceId, ProjectId, StepIndex),
        CONSTRAINT CK_CorePilotTeamChecklist_StepIndex CHECK (StepIndex BETWEEN 0 AND 3),
        CONSTRAINT FK_CorePilotTeamChecklist_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_CorePilotTeamChecklist_Scope_Step
        ON dbo.CorePilotTeamChecklist (TenantId, WorkspaceId, ProjectId, StepIndex)
        INCLUDE (IsCompleted, UpdatedUtc);
END;
GO

IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = N'ArchLucidTenantScope')
   AND OBJECT_ID(N'dbo.CorePilotTeamChecklist', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.security_predicates AS p
        INNER JOIN sys.objects AS t ON t.object_id = p.target_object_id
        WHERE SCHEMA_NAME(t.schema_id) = N'dbo'
          AND t.name = N'CorePilotTeamChecklist')
BEGIN
    ALTER SECURITY POLICY rls.ArchLucidTenantScope
        ADD FILTER PREDICATE rls.archlucid_scope_predicate(TenantId, WorkspaceId, ProjectId) ON dbo.CorePilotTeamChecklist,
        ADD BLOCK PREDICATE rls.archlucid_scope_predicate(TenantId, WorkspaceId, ProjectId) ON dbo.CorePilotTeamChecklist AFTER INSERT,
        ADD BLOCK PREDICATE rls.archlucid_scope_predicate(TenantId, WorkspaceId, ProjectId) ON dbo.CorePilotTeamChecklist AFTER UPDATE,
        ADD BLOCK PREDICATE rls.archlucid_scope_predicate(TenantId, WorkspaceId, ProjectId) ON dbo.CorePilotTeamChecklist BEFORE DELETE;
END;
GO

IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'ArchLucidApp')
   AND OBJECT_ID(N'dbo.CorePilotTeamChecklist', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.database_permissions AS dp
        WHERE dp.major_id = OBJECT_ID(N'dbo.CorePilotTeamChecklist')
          AND dp.grantee_principal_id = DATABASE_PRINCIPAL_ID(N'ArchLucidApp')
          AND dp.permission_name = N'SELECT')
BEGIN
    GRANT SELECT, INSERT, UPDATE ON dbo.CorePilotTeamChecklist TO [ArchLucidApp];
END;
GO
