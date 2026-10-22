/*
  Rollback 408: Architect-confirmed diagram node to inventory resource mappings.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.InfrastructureDiagramNodeMappings', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.InfrastructureDiagramNodeMappings;
END;
GO
