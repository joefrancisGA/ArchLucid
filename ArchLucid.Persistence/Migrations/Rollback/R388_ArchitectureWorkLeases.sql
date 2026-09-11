/*
  R388: Rollback 388_ArchitectureWorkLeases.sql — drop dbo.ArchitectureWorkLeases.
*/

IF OBJECT_ID(N'dbo.ArchitectureWorkLeases', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.ArchitectureWorkLeases;
END;
GO
