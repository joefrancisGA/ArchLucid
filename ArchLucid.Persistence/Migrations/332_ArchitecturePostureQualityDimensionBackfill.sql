-- TB-2374: backfill FindingRecords.QualityDimension from category map and specialist property bag.
IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.PillarCategoryMap', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingRecords', N'QualityDimension') IS NOT NULL
BEGIN
    UPDATE fr
    SET fr.QualityDimension = pcm.PillarKey
    FROM dbo.FindingRecords AS fr
    INNER JOIN dbo.PillarCategoryMap AS pcm
        ON pcm.SourceCategory = fr.Category
    WHERE fr.QualityDimension IS NULL
      AND pcm.PillarKey IS NOT NULL
      AND pcm.IsReviewIntegrity = 0;
END;
GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.FindingProperties', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingRecords', N'QualityDimension') IS NOT NULL
BEGIN
    UPDATE fr
    SET fr.QualityDimension = CASE fp.PropertyValue
        WHEN N'Reliability' THEN N'ReliabilityAndResilience'
        WHEN N'Security' THEN N'Security'
        WHEN N'PerformanceScalability' THEN N'PerformanceAndScalability'
        WHEN N'Cost' THEN N'CostEffectiveness'
        WHEN N'Operations' THEN N'OperationalExcellence'
        WHEN N'PrivacyCompliance' THEN N'DataAndCompliance'
        WHEN N'DataArchitecture' THEN N'DataAndCompliance'
        WHEN N'Integration' THEN N'ReliabilityAndResilience'
        WHEN N'Maintainability' THEN N'OperationalExcellence'
        WHEN N'AiSpecificRisk' THEN N'Security'
        ELSE NULL
    END
    FROM dbo.FindingRecords AS fr
    INNER JOIN dbo.FindingProperties AS fp
        ON fp.FindingRecordId = fr.FindingRecordId
    WHERE fr.QualityDimension IS NULL
      AND fr.Category = N'ArchitectureIntelligence'
      AND fp.PropertyKey = N'architectureIntelligence.dimension'
      AND fp.PropertyValue IS NOT NULL;
END;
GO
