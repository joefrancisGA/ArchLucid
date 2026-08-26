/*
  R326: Rollback 326_ArchitectureKnowledgeModels_IsProvisionalSynthesis.sql —
  drop provisional synthesis flag from dbo.ArchitectureKnowledgeModels.
*/

IF OBJECT_ID(N'dbo.ArchitectureKnowledgeModels', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureKnowledgeModels', N'IsProvisionalSynthesis') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.default_constraints
        WHERE name = N'DF_ArchitectureKnowledgeModels_IsProvisionalSynthesis')
    BEGIN
        ALTER TABLE dbo.ArchitectureKnowledgeModels
            DROP CONSTRAINT DF_ArchitectureKnowledgeModels_IsProvisionalSynthesis;
    END;

    ALTER TABLE dbo.ArchitectureKnowledgeModels DROP COLUMN IsProvisionalSynthesis;
END;
GO
