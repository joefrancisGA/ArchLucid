/*
  TB-250 — authority pipeline stage outcomes for in-product stage timeline (operator run detail).
*/

IF OBJECT_ID(N'dbo.RunStageOutcomes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RunStageOutcomes
    (
        RunId          UNIQUEIDENTIFIER NOT NULL,
        StageName      NVARCHAR(64)     NOT NULL,
        StartedUtc     DATETIME2(7)     NOT NULL,
        CompletedUtc   DATETIME2(7)     NULL,
        OutcomeStatus  NVARCHAR(32)     NOT NULL
            CONSTRAINT DF_RunStageOutcomes_OutcomeStatus DEFAULT (N'running'),
        CONSTRAINT PK_RunStageOutcomes PRIMARY KEY (RunId, StageName),
        CONSTRAINT CK_RunStageOutcomes_OutcomeStatus CHECK (
            OutcomeStatus IN (N'running', N'succeeded', N'failed', N'skipped')),
        CONSTRAINT FK_RunStageOutcomes_Runs_RunId FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId)
    );

    CREATE NONCLUSTERED INDEX IX_RunStageOutcomes_RunId
        ON dbo.RunStageOutcomes (RunId)
        INCLUDE (StageName, StartedUtc, CompletedUtc, OutcomeStatus);
END;
GO
