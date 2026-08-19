-- Migration 298: TB-970 per-task execution mode + cache-served disclosure on dbo.AgentResults.

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AgentResults', N'TaskStructuralExecutionMode') IS NULL
        ALTER TABLE dbo.AgentResults ADD TaskStructuralExecutionMode TINYINT NULL;

    IF COL_LENGTH(N'dbo.AgentResults', N'CacheServed') IS NULL
        ALTER TABLE dbo.AgentResults ADD CacheServed BIT NOT NULL
            CONSTRAINT DF_AgentResults_CacheServed DEFAULT (0);
END;
GO
