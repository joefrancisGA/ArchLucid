/*
  R225: Rollback 225_BatchB_StickinessWorkflow.sql — drop risk exceptions table and finding review disposition columns.
*/

IF OBJECT_ID(N'dbo.RiskExceptions', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.RiskExceptions;
END;
GO

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingReviewEvents', N'EvidenceRequestText') IS NOT NULL
    ALTER TABLE dbo.FindingReviewEvents DROP COLUMN EvidenceRequestText;
GO

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingReviewEvents', N'RevisitDueUtc') IS NOT NULL
    ALTER TABLE dbo.FindingReviewEvents DROP COLUMN RevisitDueUtc;
GO

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingReviewEvents', N'Disposition') IS NOT NULL
    ALTER TABLE dbo.FindingReviewEvents DROP COLUMN Disposition;
GO
