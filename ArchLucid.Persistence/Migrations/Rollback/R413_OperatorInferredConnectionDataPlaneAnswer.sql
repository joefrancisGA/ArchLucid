/*
  Rollback 413: drop the operator data-plane answer.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.OperatorInferredConnections', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.OperatorInferredConnections', N'DataPlaneAnswer') IS NOT NULL
BEGIN
    ALTER TABLE dbo.OperatorInferredConnections
        DROP COLUMN DataPlaneAnswer;
END;
GO
