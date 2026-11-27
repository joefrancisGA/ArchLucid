/* Roll back API and worker binaries before removing this schema addition. */
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF COL_LENGTH(N'dbo.AnalysisStageRecovery', N'CoverageReason') IS NOT NULL
    BEGIN
        EXEC sys.sp_executesql N'
            IF EXISTS (SELECT 1 FROM dbo.AnalysisStageRecovery WITH (TABLOCKX, HOLDLOCK) WHERE CoverageReason IS NOT NULL)
                THROW 51441, ''Retain recorded coverage reasons as provenance.'', 1;

            ALTER TABLE dbo.AnalysisStageRecovery DROP CONSTRAINT CK_AnalysisStageRecovery_CoverageReason;
            ALTER TABLE dbo.AnalysisStageRecovery DROP COLUMN CoverageReason;';
    END;

    IF COL_LENGTH(N'dbo.AnalysisStageRecoveryHistory', N'CoverageReason') IS NOT NULL
    BEGIN
        EXEC sys.sp_executesql N'
            IF EXISTS (SELECT 1 FROM dbo.AnalysisStageRecoveryHistory WITH (TABLOCKX, HOLDLOCK) WHERE CoverageReason IS NOT NULL)
                THROW 51441, ''Retain recorded historical coverage reasons as provenance.'', 1;

            ALTER TABLE dbo.AnalysisStageRecoveryHistory DROP COLUMN CoverageReason;';
    END;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
