/*
  R182: Rollback 182_AgentResults_AiBatchD.sql — remove AI Batch D calibration columns and tables.
*/

IF OBJECT_ID(N'dbo.TenantCuratedEvidenceEntries', N'U') IS NOT NULL
    DROP TABLE dbo.TenantCuratedEvidenceEntries;
GO

IF OBJECT_ID(N'dbo.AgentOutputCalibrationSamples', N'U') IS NOT NULL
    DROP TABLE dbo.AgentOutputCalibrationSamples;
GO

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentResults', N'ProposedEvidenceJson') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AgentResults DROP COLUMN ProposedEvidenceJson;
END;
GO

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentResults', N'CalibratedConfidence') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AgentResults DROP COLUMN CalibratedConfidence;
END;
GO
