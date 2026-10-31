/*
  R419: Rollback 419_SecureNowCapacityLeases.sql.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecureNowCapacityLeases', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.SecureNowCapacityLeases;
END;
GO
