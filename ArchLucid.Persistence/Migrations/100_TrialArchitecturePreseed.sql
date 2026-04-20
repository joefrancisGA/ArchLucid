SET NOCOUNT ON;
GO

/* 100: Trial architecture pre-seed queue columns — worker completes simulator run + commit after self-service trial. */

IF COL_LENGTH(N'dbo.Tenants', N'TrialArchitecturePreseedEnqueuedUtc') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD TrialArchitecturePreseedEnqueuedUtc DATETIMEOFFSET NULL;
END;
GO

IF COL_LENGTH(N'dbo.Tenants', N'TrialWelcomeRunId') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD TrialWelcomeRunId UNIQUEIDENTIFIER NULL;
END;
GO
