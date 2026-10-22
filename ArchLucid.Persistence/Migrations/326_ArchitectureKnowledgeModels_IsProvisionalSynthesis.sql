/*
  326 — Persist κ provisional synthesis flag on dbo.ArchitectureKnowledgeModels.
*/
IF COL_LENGTH(N'dbo.ArchitectureKnowledgeModels', N'IsProvisionalSynthesis') IS NULL
BEGIN
    ALTER TABLE dbo.ArchitectureKnowledgeModels
        ADD IsProvisionalSynthesis BIT NOT NULL
            CONSTRAINT DF_ArchitectureKnowledgeModels_IsProvisionalSynthesis DEFAULT (0);
END
