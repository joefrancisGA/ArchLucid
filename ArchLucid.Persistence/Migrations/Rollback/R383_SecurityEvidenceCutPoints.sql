/*
  Rollback 383: SecureNow architect — cut-point analysis (SA-10).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidenceCutPoints', N'U') IS NOT NULL
    DROP TABLE dbo.SecurityEvidenceCutPoints;
GO
