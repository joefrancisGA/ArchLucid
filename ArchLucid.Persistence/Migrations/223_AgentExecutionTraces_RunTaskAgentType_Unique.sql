/*
  TB-044 — one canonical AgentExecutionTrace row per (RunId, TaskId, AgentType).
*/

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    ;WITH ranked AS (
        SELECT TraceId,
               ROW_NUMBER() OVER (
                   PARTITION BY RunId, TaskId, AgentType
                   ORDER BY CreatedUtc DESC, TraceId DESC) AS rn
        FROM dbo.AgentExecutionTraces
    )
    DELETE t
    FROM dbo.AgentExecutionTraces AS t
    INNER JOIN ranked AS r ON r.TraceId = t.TraceId
    WHERE r.rn > 1;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_AgentExecutionTraces_RunId_TaskId_AgentType'
          AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
        CREATE UNIQUE INDEX UX_AgentExecutionTraces_RunId_TaskId_AgentType
            ON dbo.AgentExecutionTraces (RunId, TaskId, AgentType);
END;
GO
