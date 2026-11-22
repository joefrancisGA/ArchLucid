/*
  Add SQL Server-managed optimistic concurrency token to remediation instances.
  Additive and idempotent; existing rows receive generated rowversion values.
  This migration does not yet change repository update semantics.
*/
IF OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RemediationInstances', N'RowVersion') IS NULL
BEGIN
    ALTER TABLE dbo.RemediationInstances ADD RowVersion rowversion NOT NULL;
END;
GO
