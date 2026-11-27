/* Allow FND-074 terminal outcomes while preserving the original timeline values. */
IF OBJECT_ID(N'dbo.RunStageOutcomes', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'dbo.CK_RunStageOutcomes_OutcomeStatus', N'C') IS NOT NULL
        ALTER TABLE dbo.RunStageOutcomes DROP CONSTRAINT CK_RunStageOutcomes_OutcomeStatus;

    ALTER TABLE dbo.RunStageOutcomes WITH CHECK
        ADD CONSTRAINT CK_RunStageOutcomes_OutcomeStatus CHECK
        (
            OutcomeStatus IN (N'running', N'succeeded', N'failed', N'skipped',
                              N'timed_out', N'canceled', N'retry_exhausted', N'not_started')
        );
END;
GO
