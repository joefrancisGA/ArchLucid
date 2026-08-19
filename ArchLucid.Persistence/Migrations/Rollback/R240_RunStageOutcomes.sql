/*
  R240: Rollback 240_RunStageOutcomes.sql — drop authority pipeline stage outcome ledger.
*/

IF OBJECT_ID(N'dbo.RunStageOutcomes', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.RunStageOutcomes;
END;
GO
