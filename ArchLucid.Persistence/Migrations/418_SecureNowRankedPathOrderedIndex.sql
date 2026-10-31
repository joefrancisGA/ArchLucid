/*
  SecureNow: scoped path header lookup for ranked-page JOINs.

  The rank index already carries PathId via its clustered key; creating
  an explicit duplicate sort index would add write overhead without a
  demonstrated benefit. Instead enable a narrow, project-scoped path
  lookup while retaining the existing PK and index definitions.
  Safe to rerun; no row or evidence mutation.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePaths', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE object_id = OBJECT_ID(N'dbo.SecurityEvidencePaths')
         AND name = N'IX_SecurityEvidencePaths_Tenant_Workspace_Project_Snapshot_Path'
   )
BEGIN
    CREATE NONCLUSTERED INDEX IX_SecurityEvidencePaths_Tenant_Workspace_Project_Snapshot_Path
        ON dbo.SecurityEvidencePaths (TenantId, WorkspaceId, ProjectId, SnapshotId, PathId);
END;
GO
