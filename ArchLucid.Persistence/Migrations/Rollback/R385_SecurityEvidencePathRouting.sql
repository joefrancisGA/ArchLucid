/*
  Rollback 385: SecureNow architect — path organizational routing (SA-15).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathRouting', N'U') IS NOT NULL
    DROP TABLE dbo.SecurityEvidencePathRouting;
GO
