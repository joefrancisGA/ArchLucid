-- Rollback for 056_AgentExecutionTrace_BlobUploadFailed.sql — DESTRUCTIVE (drops column); use with backup only.
IF COL_LENGTH('dbo.AgentExecutionTraces', 'BlobUploadFailed') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN BlobUploadFailed;
END
