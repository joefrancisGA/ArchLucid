/*
  R399: Rollback 399_OperatorInferredConnections.sql — drop operator inferred connections table.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.OperatorInferredConnections', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.OperatorInferredConnections;
END;
GO
