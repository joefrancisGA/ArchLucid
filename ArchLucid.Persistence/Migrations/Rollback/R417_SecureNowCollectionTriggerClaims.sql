/*
  R417: Rollback 417_SecureNowCollectionTriggerClaims.sql.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecureNowCollectionTriggerClaims', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.SecureNowCollectionTriggerClaims;
END;
GO
