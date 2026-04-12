/*
  RLS defense-in-depth: denormalize tenant/workspace/project scope onto high-traffic child tables
  dbo.ContextSnapshots, dbo.FindingsSnapshots, dbo.GoldenManifestAssumptions.

  ContextSnapshots already has ProjectId NVARCHAR(200) for logical project key; RLS uses
  ScopeProjectId UNIQUEIDENTIFIER (aligned with dbo.Runs.ScopeProjectId / SESSION_CONTEXT af_project_id).

  Adds FILTER predicates to rls.ArchiforgeTenantScope idempotently (skip if already present).

  See docs/security/MULTI_TENANT_RLS.md.
*/

SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ContextSnapshots', N'TenantId') IS NULL
        ALTER TABLE dbo.ContextSnapshots ADD TenantId UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH(N'dbo.ContextSnapshots', N'WorkspaceId') IS NULL
        ALTER TABLE dbo.ContextSnapshots ADD WorkspaceId UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH(N'dbo.ContextSnapshots', N'ScopeProjectId') IS NULL
        ALTER TABLE dbo.ContextSnapshots ADD ScopeProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingsSnapshots', N'TenantId') IS NULL
        ALTER TABLE dbo.FindingsSnapshots ADD TenantId UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH(N'dbo.FindingsSnapshots', N'WorkspaceId') IS NULL
        ALTER TABLE dbo.FindingsSnapshots ADD WorkspaceId UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH(N'dbo.FindingsSnapshots', N'ProjectId') IS NULL
        ALTER TABLE dbo.FindingsSnapshots ADD ProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestAssumptions', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GoldenManifestAssumptions', N'TenantId') IS NULL
        ALTER TABLE dbo.GoldenManifestAssumptions ADD TenantId UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH(N'dbo.GoldenManifestAssumptions', N'WorkspaceId') IS NULL
        ALTER TABLE dbo.GoldenManifestAssumptions ADD WorkspaceId UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH(N'dbo.GoldenManifestAssumptions', N'ProjectId') IS NULL
        ALTER TABLE dbo.GoldenManifestAssumptions ADD ProjectId UNIQUEIDENTIFIER NULL;
END;
GO

UPDATE cs
SET
    cs.TenantId = r.TenantId,
    cs.WorkspaceId = r.WorkspaceId,
    cs.ScopeProjectId = r.ScopeProjectId
FROM dbo.ContextSnapshots AS cs
INNER JOIN dbo.Runs AS r ON cs.RunId = r.RunId
WHERE cs.TenantId IS NULL;
GO

UPDATE fs
SET
    fs.TenantId = r.TenantId,
    fs.WorkspaceId = r.WorkspaceId,
    fs.ProjectId = r.ScopeProjectId
FROM dbo.FindingsSnapshots AS fs
INNER JOIN dbo.Runs AS r ON fs.RunId = r.RunId
WHERE fs.TenantId IS NULL;
GO

UPDATE gma
SET
    gma.TenantId = gm.TenantId,
    gma.WorkspaceId = gm.WorkspaceId,
    gma.ProjectId = gm.ProjectId
FROM dbo.GoldenManifestAssumptions AS gma
INNER JOIN dbo.GoldenManifests AS gm ON gma.ManifestId = gm.ManifestId
WHERE gma.TenantId IS NULL;
GO

DECLARE @PolicyObjectId INT;

SELECT @PolicyObjectId = object_id
FROM sys.security_policies
WHERE name = N'ArchiforgeTenantScope';

IF @PolicyObjectId IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sys.security_predicates AS sp
        WHERE sp.object_id = @PolicyObjectId
          AND sp.target_object_id = OBJECT_ID(N'dbo.ContextSnapshots', N'U'))
        EXEC(N'ALTER SECURITY POLICY rls.ArchiforgeTenantScope ADD FILTER PREDICATE rls.archiforge_scope_predicate(TenantId, WorkspaceId, ScopeProjectId) ON dbo.ContextSnapshots');

    IF NOT EXISTS (
        SELECT 1
        FROM sys.security_predicates AS sp
        WHERE sp.object_id = @PolicyObjectId
          AND sp.target_object_id = OBJECT_ID(N'dbo.FindingsSnapshots', N'U'))
        EXEC(N'ALTER SECURITY POLICY rls.ArchiforgeTenantScope ADD FILTER PREDICATE rls.archiforge_scope_predicate(TenantId, WorkspaceId, ProjectId) ON dbo.FindingsSnapshots');

    IF NOT EXISTS (
        SELECT 1
        FROM sys.security_predicates AS sp
        WHERE sp.object_id = @PolicyObjectId
          AND sp.target_object_id = OBJECT_ID(N'dbo.GoldenManifestAssumptions', N'U'))
        EXEC(N'ALTER SECURITY POLICY rls.ArchiforgeTenantScope ADD FILTER PREDICATE rls.archiforge_scope_predicate(TenantId, WorkspaceId, ProjectId) ON dbo.GoldenManifestAssumptions');
END;
GO
