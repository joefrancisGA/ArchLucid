/* Rollback DbUp 265 — remove SourceEvidenceLinksJson from RecommendationRecords. */
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_RecommendationRecords_SourceEvidenceLinksJson_IsJson')
    BEGIN
        ALTER TABLE dbo.RecommendationRecords DROP CONSTRAINT CK_RecommendationRecords_SourceEvidenceLinksJson_IsJson;
    END;

    IF COL_LENGTH(N'dbo.RecommendationRecords', N'SourceEvidenceLinksJson') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.RecommendationRecords DROP CONSTRAINT DF_RecommendationRecords_SourceEvidenceLinksJson;

        ALTER TABLE dbo.RecommendationRecords DROP COLUMN SourceEvidenceLinksJson;
    END;
END;
GO
