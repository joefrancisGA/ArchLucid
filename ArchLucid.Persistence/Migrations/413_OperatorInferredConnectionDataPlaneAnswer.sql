/*
  413: Persist the operator's read/write answer for an unmapped data-plane role.
*/

SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.OperatorInferredConnections', N'DataPlaneAnswer') IS NULL
BEGIN
    ALTER TABLE dbo.OperatorInferredConnections
        ADD DataPlaneAnswer INT NULL;
END;
GO
