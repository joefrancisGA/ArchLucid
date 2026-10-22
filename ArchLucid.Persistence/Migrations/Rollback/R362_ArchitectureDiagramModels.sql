/*
  Rollback 362: Architecture diagram structured ingest (IE-18).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.ArchitectureDiagramModels', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.ArchitectureDiagramModels;
END;
GO
