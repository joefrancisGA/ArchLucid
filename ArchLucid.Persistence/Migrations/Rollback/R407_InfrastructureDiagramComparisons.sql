/*
  Rollback 407: Advisory diagram-to-inventory comparisons.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.InfrastructureDiagramComparisons', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.InfrastructureDiagramComparisons;
END;
GO
