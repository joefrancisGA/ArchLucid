/*
  Roll back DbUp 166 — remove dbo.TenantWorkspaces.IsDemoWorkspace.
*/

IF COL_LENGTH(N'dbo.TenantWorkspaces', N'IsDemoWorkspace') IS NOT NULL
BEGIN
    ALTER TABLE dbo.TenantWorkspaces DROP CONSTRAINT IF EXISTS DF_TenantWorkspaces_IsDemoWorkspace;
    ALTER TABLE dbo.TenantWorkspaces DROP COLUMN IsDemoWorkspace;
END;
GO
