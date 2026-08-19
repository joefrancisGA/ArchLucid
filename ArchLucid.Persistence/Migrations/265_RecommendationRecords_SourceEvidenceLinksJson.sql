/* 265: Persist navigable sourceEvidenceLinks on advisory recommendations (TB-400). */
IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RecommendationRecords', N'SourceEvidenceLinksJson') IS NULL
BEGIN
    ALTER TABLE dbo.RecommendationRecords
        ADD SourceEvidenceLinksJson NVARCHAR(MAX) NOT NULL
            CONSTRAINT DF_RecommendationRecords_SourceEvidenceLinksJson DEFAULT (N'[]');
END;
GO

IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RecommendationRecords', N'SourceEvidenceLinksJson') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_RecommendationRecords_SourceEvidenceLinksJson_IsJson')
   AND NOT EXISTS (SELECT 1 FROM dbo.RecommendationRecords AS t WHERE ISJSON(t.SourceEvidenceLinksJson) <> 1)
BEGIN
    ALTER TABLE dbo.RecommendationRecords ADD CONSTRAINT CK_RecommendationRecords_SourceEvidenceLinksJson_IsJson
        CHECK (ISJSON(SourceEvidenceLinksJson) = 1);
END;
GO
