/* Roll back the application/disable new recovery admission before dropping an unused table. */
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF OBJECT_ID(N'dbo.SecureNowAnalysisRecoveryJobs', N'U') IS NOT NULL
    BEGIN
        IF EXISTS (SELECT 1 FROM dbo.SecureNowAnalysisRecoveryJobs WITH (TABLOCKX, HOLDLOCK))
            THROW 51439, 'Retain SecureNow recovery admissions.', 1;

        DROP TABLE dbo.SecureNowAnalysisRecoveryJobs;
    END;
    IF OBJECT_ID(N'dbo.AnalysisStageRecovery', N'U') IS NOT NULL
    BEGIN
        IF EXISTS (SELECT 1 FROM dbo.AnalysisStageRecovery WITH (TABLOCKX, HOLDLOCK))
            THROW 51439, 'Retain analysis checkpoints for unfinished work and recovery evidence.', 1;

        DROP TABLE dbo.AnalysisStageRecovery;
    END;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
