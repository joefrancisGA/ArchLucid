/*
  R419: Manual-only rollback for 419_SecureNowCapacityLeases.sql.
  DESTRUCTIVE: dropping the table removes fencing tokens and active lease
  ownership. First stop collection workers and reconcile external operations.
  Requires approved change control and verified backup/PITR recovery plan.
  An expired or removed lease does NOT authorize external trigger replay.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecureNowCapacityLeases', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.SecureNowCapacityLeases;
END;
GO
