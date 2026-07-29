-- Rollback TB-1976 / TB-1977: closed-loop architecture reasoning source layer + knowledge models.

IF OBJECT_ID(N'dbo.ArchitectureKnowledgeModels', N'U') IS NOT NULL
    DROP TABLE dbo.ArchitectureKnowledgeModels;
GO

IF OBJECT_ID(N'dbo.ArchitectureIntelligenceSources', N'U') IS NOT NULL
    DROP TABLE dbo.ArchitectureIntelligenceSources;
GO
