/* Rollback refuses to discard newly recorded analysis outcome evidence. */
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF OBJECT_ID(N'dbo.RunStageOutcomes', N'U') IS NOT NULL
    BEGIN
        IF EXISTS (
            SELECT 1 FROM dbo.RunStageOutcomes WITH (TABLOCKX, HOLDLOCK)
            WHERE OutcomeStatus NOT IN (N'running', N'succeeded', N'failed', N'skipped'))
            THROW 51438, 'New analysis stage outcomes exist; rollback would invalidate timeline evidence.', 1;

        IF OBJECT_ID(N'dbo.CK_RunStageOutcomes_OutcomeStatus', N'C') IS NOT NULL
            ALTER TABLE dbo.RunStageOutcomes DROP CONSTRAINT CK_RunStageOutcomes_OutcomeStatus;

        ALTER TABLE dbo.RunStageOutcomes WITH CHECK
            ADD CONSTRAINT CK_RunStageOutcomes_OutcomeStatus
            CHECK (OutcomeStatus IN (N'running', N'succeeded', N'failed', N'skipped'));
    END;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
