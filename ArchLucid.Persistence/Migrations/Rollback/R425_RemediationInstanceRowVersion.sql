/*
  Rollback 425: Remove the additive SQL Server-managed RowVersion column.
  This is idempotent; only remove the column when it exists.
  Ensure no active consumers depend on optimistic concurrency before rolling back.
*/
IF OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RemediationInstances', N'RowVersion') IS NOT NULL
BEGIN
    ALTER TABLE dbo.RemediationInstances DROP COLUMN RowVersion;
END;
GO
