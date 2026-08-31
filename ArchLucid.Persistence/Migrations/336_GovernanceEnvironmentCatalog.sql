/*
  336 — Tenant-scoped governance environment definitions and allowed transitions.

  Replaces the hardcoded dev → test → prod ladder with administrator-configurable
  environment slots and transition edges per workspace scope.
*/

IF OBJECT_ID(N'dbo.GovernanceEnvironmentDefinitions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GovernanceEnvironmentDefinitions
    (
        EnvironmentDefinitionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_GovernanceEnvironmentDefinitions PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        Slug NVARCHAR(64) NOT NULL,
        DisplayName NVARCHAR(200) NOT NULL,
        SortOrder INT NOT NULL,
        IsActive BIT NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        LastModifiedUtc DATETIME2 NULL
    );

    CREATE UNIQUE NONCLUSTERED INDEX UX_GovernanceEnvironmentDefinitions_Scope_Slug
        ON dbo.GovernanceEnvironmentDefinitions (TenantId, WorkspaceId, ProjectId, Slug);

    CREATE NONCLUSTERED INDEX IX_GovernanceEnvironmentDefinitions_Scope_SortOrder
        ON dbo.GovernanceEnvironmentDefinitions (TenantId, WorkspaceId, ProjectId, SortOrder);
END;
GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentTransitions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GovernanceEnvironmentTransitions
    (
        TransitionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_GovernanceEnvironmentTransitions PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SourceSlug NVARCHAR(64) NOT NULL,
        TargetSlug NVARCHAR(64) NOT NULL
    );

    CREATE UNIQUE NONCLUSTERED INDEX UX_GovernanceEnvironmentTransitions_Scope_Edge
        ON dbo.GovernanceEnvironmentTransitions (TenantId, WorkspaceId, ProjectId, SourceSlug, TargetSlug);

    CREATE NONCLUSTERED INDEX IX_GovernanceEnvironmentTransitions_Scope_Source
        ON dbo.GovernanceEnvironmentTransitions (TenantId, WorkspaceId, ProjectId, SourceSlug);
END;
GO
