-- TB-878: iterative retrieve-critique-retry grounding trace columns
IF COL_LENGTH('dbo.RetrievalGroundingTrace', 'IterativeRetrievalRounds') IS NULL
BEGIN
    ALTER TABLE dbo.RetrievalGroundingTrace
        ADD IterativeRetrievalRounds INT NULL;
END;

IF COL_LENGTH('dbo.RetrievalGroundingTrace', 'IterativeCritiqueDecisionsJson') IS NULL
BEGIN
    ALTER TABLE dbo.RetrievalGroundingTrace
        ADD IterativeCritiqueDecisionsJson NVARCHAR(4000) NULL;
END;
