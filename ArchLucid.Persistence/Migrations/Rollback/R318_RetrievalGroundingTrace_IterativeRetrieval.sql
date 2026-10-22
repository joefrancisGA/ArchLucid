/*
  R318: Rollback 318_RetrievalGroundingTrace_IterativeRetrieval.sql — drop iterative retrieval grounding trace columns.
*/

IF OBJECT_ID(N'dbo.RetrievalGroundingTrace', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'IterativeCritiqueDecisionsJson') IS NOT NULL
    ALTER TABLE dbo.RetrievalGroundingTrace DROP COLUMN IterativeCritiqueDecisionsJson;
GO

IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'IterativeRetrievalRounds') IS NOT NULL
    ALTER TABLE dbo.RetrievalGroundingTrace DROP COLUMN IterativeRetrievalRounds;
GO
