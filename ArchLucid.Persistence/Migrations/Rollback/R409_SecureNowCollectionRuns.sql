/*
  Rollback 409: SecureNow collection run records.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecureNowCollectionRuns', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.SecureNowCollectionRuns;
END;
GO
