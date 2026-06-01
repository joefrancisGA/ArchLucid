/*
  R232: Rollback 232_AgentToolInvocationRecords.sql — drop structured per-trace tool invocation ledger.
*/

IF OBJECT_ID(N'dbo.AgentToolInvocationRecords', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AgentToolInvocationRecords;
END;
GO
