/*
  R417: Manual-only rollback for 417_SecureNowCollectionTriggerClaims.sql.
  DESTRUCTIVE: removing claim records can defeat replay protection. Only run
  with approved change control, a verified backup/PITR plan, and reconciliation
  of any already-triggered external Azure Automation operations. Never infer
  that dropping this table permits restarting an external collection operation.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecureNowCollectionTriggerClaims', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.SecureNowCollectionTriggerClaims;
END;
GO
