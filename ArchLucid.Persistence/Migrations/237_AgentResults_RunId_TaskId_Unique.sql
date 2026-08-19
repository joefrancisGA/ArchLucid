/*
  TB-201 — one canonical AgentResult row per (RunId, TaskId); multi-replica duplicate guard.
*/

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
BEGIN
    ;WITH ranked AS (
        SELECT ResultId,
               ROW_NUMBER() OVER (
                   PARTITION BY RunId, TaskId
                   ORDER BY CreatedUtc DESC, ResultId DESC) AS rn
        FROM dbo.AgentResults
    )
    DELETE t
    FROM dbo.AgentResults AS t
    INNER JOIN ranked AS r ON r.ResultId = t.ResultId
    WHERE r.rn > 1;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_AgentResults_RunId_TaskId'
          AND object_id = OBJECT_ID(N'dbo.AgentResults'))
        CREATE UNIQUE INDEX UX_AgentResults_RunId_TaskId
            ON dbo.AgentResults (RunId, TaskId);
END;
GO
