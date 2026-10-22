/* Rollback DbUp 267 — drop manifest fine-tuning export audit and model registry tables (TB-594). */
IF OBJECT_ID(N'dbo.FineTunedModelRegistryEntries', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.FineTunedModelRegistryEntries;
END;
GO

IF OBJECT_ID(N'dbo.FineTuningTrainingExportAudits', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.FineTuningTrainingExportAudits;
END;
GO
