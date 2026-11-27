/* FND-077: keep diagnostics separate from success-only checkpoint result references. */
IF COL_LENGTH(N'dbo.AnalysisStageRecovery', N'CoverageReason') IS NULL
BEGIN
    ALTER TABLE dbo.AnalysisStageRecovery
        ADD CoverageReason NVARCHAR(64) NULL;
END;
GO

IF OBJECT_ID(N'dbo.CK_AnalysisStageRecovery_CoverageReason', N'C') IS NULL
BEGIN
    ALTER TABLE dbo.AnalysisStageRecovery WITH CHECK
        ADD CONSTRAINT CK_AnalysisStageRecovery_CoverageReason CHECK (CoverageReason IS NULL OR State = N'failed');
END;
GO

IF COL_LENGTH(N'dbo.AnalysisStageRecoveryHistory', N'CoverageReason') IS NULL
BEGIN
    ALTER TABLE dbo.AnalysisStageRecoveryHistory
        ADD CoverageReason NVARCHAR(64) NULL;
END;
GO
