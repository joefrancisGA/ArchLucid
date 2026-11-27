/* Disable new dependency-aware admissions and drain active work before rollback. */
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF OBJECT_ID(N'dbo.AnalysisStageRecoveryHistory', N'U') IS NOT NULL
    BEGIN
        IF EXISTS (SELECT 1 FROM dbo.AnalysisStageRecoveryHistory WITH (TABLOCKX, HOLDLOCK))
            THROW 51440, 'Retain superseded analysis checkpoints as provenance.', 1;

        DROP TABLE dbo.AnalysisStageRecoveryHistory;
    END;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
