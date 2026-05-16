/*
  Workspace A/B demo posture: tenant-level workspace flag excluding fixtures from billed workspace SKU math.
  Operators still enforce read-only evaluator behaviour via IAM (Reader roles), not exclusively via SQL.
*/

IF COL_LENGTH(N'dbo.TenantWorkspaces', N'IsDemoWorkspace') IS NULL
    ALTER TABLE dbo.TenantWorkspaces ADD IsDemoWorkspace BIT NOT NULL CONSTRAINT DF_TenantWorkspaces_IsDemoWorkspace DEFAULT (0);
GO
