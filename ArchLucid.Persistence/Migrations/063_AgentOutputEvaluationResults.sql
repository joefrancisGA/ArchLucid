-- Persisted scores from optional reference-case evaluation (AgentExecution:ReferenceEvaluation).

IF OBJECT_ID(N'dbo.AgentOutputEvaluationResults', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentOutputEvaluationResults
    (
        EvaluationId     UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_AgentOutputEvaluationResults_EvaluationId DEFAULT (NEWSEQUENTIALID()),
        RunId            NVARCHAR(64)     NOT NULL,
        TraceId          NVARCHAR(64)     NOT NULL,
        CaseId           NVARCHAR(128)    NOT NULL,
        AgentType        NVARCHAR(50)     NOT NULL,
        OverallScore     FLOAT            NOT NULL,
        StructuralMatch  FLOAT            NULL,
        SemanticMatch    FLOAT            NULL,
        MissingKeysJson  NVARCHAR(MAX)    NULL,
        CreatedUtc       DATETIME2        NOT NULL,
        CONSTRAINT PK_AgentOutputEvaluationResults PRIMARY KEY (EvaluationId)
    );

    CREATE NONCLUSTERED INDEX IX_AgentOutputEvaluationResults_RunId_CreatedUtc
        ON dbo.AgentOutputEvaluationResults (RunId, CreatedUtc DESC);
END
