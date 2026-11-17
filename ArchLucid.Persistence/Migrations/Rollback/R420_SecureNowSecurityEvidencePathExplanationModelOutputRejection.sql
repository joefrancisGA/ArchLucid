/*
  R420: Manual-only rollback for
  420_SecureNowSecurityEvidencePathExplanationModelOutputRejection.sql.

  DESTRUCTIVE: dropping ModelOutputRejection permanently removes all stored
  model-output rejection reasons. Other path explanation data is retained.
  Requires approved change control and a verified backup/PITR recovery plan.
  Export any rejection reasons that must be retained before running this script.
  Stop dependent application instances and workers first, and ensure the
  replacement application version no longer reads or writes this column.
  Prefer leaving this additive nullable column in place for an application-only
  rollback. DbUp does not run this script automatically.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathExplanations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.SecurityEvidencePathExplanations', N'ModelOutputRejection') IS NOT NULL
BEGIN
    ALTER TABLE dbo.SecurityEvidencePathExplanations
        DROP COLUMN ModelOutputRejection;
END;
GO
