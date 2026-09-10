/*
  R379: Rollback 379_FindingSemanticSupportBandOverlays.sql — drop dbo.FindingSemanticSupportBandOverlays.
*/

IF OBJECT_ID(N'dbo.FindingSemanticSupportBandOverlays', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.FindingSemanticSupportBandOverlays;
END;
GO
