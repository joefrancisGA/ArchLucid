/*
  R326: Rollback 326_ArchitectureKnowledgeModels_IsProvisionalSynthesis.sql —
  drop IsProvisionalSynthesis from dbo.ArchitectureKnowledgeModels.
*/

IF OBJECT_ID(N'dbo.DF_ArchitectureKnowledgeModels_IsProvisionalSynthesis', N'D') IS NOT NULL
    ALTER TABLE dbo.ArchitectureKnowledgeModels DROP CONSTRAINT DF_ArchitectureKnowledgeModels_IsProvisionalSynthesis;
GO

IF OBJECT_ID(N'dbo.ArchitectureKnowledgeModels', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureKnowledgeModels', N'IsProvisionalSynthesis') IS NOT NULL
    ALTER TABLE dbo.ArchitectureKnowledgeModels DROP COLUMN IsProvisionalSynthesis;
GO
