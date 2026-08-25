/*
  325 — Pin as-of-run κ reads via dbo.Runs.KnowledgeModelId instead of latest row per RunId.
*/

IF COL_LENGTH(N'dbo.Runs', N'KnowledgeModelId') IS NULL
BEGIN
    ALTER TABLE dbo.Runs ADD KnowledgeModelId NVARCHAR(64) NULL;
END;
GO
