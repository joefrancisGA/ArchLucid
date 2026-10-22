/*
  Rollback 363: Architecture diagram infrastructure reconciliation (IE-19).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.ArchitectureDiagramReconciliations', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.ArchitectureDiagramReconciliations;
END;
GO
