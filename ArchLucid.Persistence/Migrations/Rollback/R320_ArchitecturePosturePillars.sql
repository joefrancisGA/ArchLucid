/*
  R320: Rollback 320_ArchitecturePosturePillars.sql —
  drop pillar catalog tables, the FindingRecords QualityDimension index/column.
  Leaves CK_PolicyPacks_QualityDimension in place (expanded domain is backward compatible).
*/

IF OBJECT_ID(N'dbo.PillarCategoryMap', N'U') IS NOT NULL
    DROP TABLE dbo.PillarCategoryMap;
GO

IF OBJECT_ID(N'dbo.PillarCatalog', N'U') IS NOT NULL
    DROP TABLE dbo.PillarCatalog;
GO

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_FindingRecords_Scope_QualityDimension_Severity'
      AND object_id = OBJECT_ID(N'dbo.FindingRecords'))
    DROP INDEX IX_FindingRecords_Scope_QualityDimension_Severity ON dbo.FindingRecords;
GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingRecords', N'QualityDimension') IS NOT NULL
    ALTER TABLE dbo.FindingRecords DROP COLUMN QualityDimension;
GO
