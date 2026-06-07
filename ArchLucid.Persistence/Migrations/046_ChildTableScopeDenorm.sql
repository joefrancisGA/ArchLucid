/*
  Scope denormalization: denormalize tenant/workspace/project scope onto high-traffic child tables
  dbo.ContextSnapshots, dbo.FindingsSnapshots, dbo.GoldenManifestAssumptions.

  Columns support app-layer scope predicates per ADR 0037 Layer D.
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

