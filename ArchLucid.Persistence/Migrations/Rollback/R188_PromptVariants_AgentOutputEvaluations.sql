/*
  R188: Rollback 188_PromptVariants_AgentOutputEvaluations.sql — remove prompt variants, evaluation table, and AgentResults variant column.
*/

IF OBJECT_ID(N'dbo.AgentOutputEvaluations', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AgentOutputEvaluations;
END;
GO

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentResults', N'PromptVariantKey') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AgentResults DROP COLUMN PromptVariantKey;
END;
GO

IF OBJECT_ID(N'dbo.PromptVariants', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.PromptVariants;
END;
GO
