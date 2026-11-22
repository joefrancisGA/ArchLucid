/*
  Rollback 425: Remove the additive SQL Server-managed RowVersion column.
  Only use after stopping writers that rely on RowVersion; values cannot be restored.
  Idempotent no-op when the table or column is absent.
*/
IF OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RemediationInstances', N'RowVersion') IS NOT NULL
BEGIN
    ALTER TABLE dbo.RemediationInstances DROP COLUMN RowVersion;
END;
GO
