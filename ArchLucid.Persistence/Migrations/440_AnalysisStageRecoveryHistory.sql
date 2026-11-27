/* FND-076: preserve the previous checkpoint when an unsealed Authority stage is recomputed. */
IF OBJECT_ID(N'dbo.AnalysisStageRecoveryHistory', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AnalysisStageRecoveryHistory
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        Pipeline NVARCHAR(32) NOT NULL,
        RunId UNIQUEIDENTIFIER NOT NULL,
        Stage NVARCHAR(64) NOT NULL,
        InputVersion CHAR(64) NOT NULL,
        State NVARCHAR(16) NOT NULL,
        Fence BIGINT NOT NULL,
        Attempts INT NOT NULL,
        ResultReference NVARCHAR(1024) NULL,
        SupersededUtc DATETIME2(7) NOT NULL,
        CONSTRAINT PK_AnalysisStageRecoveryHistory
            PRIMARY KEY (TenantId, WorkspaceId, ProjectId, Pipeline, RunId, Stage, Fence)
    );
END;
GO
