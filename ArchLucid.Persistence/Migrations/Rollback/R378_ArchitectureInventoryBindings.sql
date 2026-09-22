/*
  R378: Rollback 378_ArchitectureInventoryBindings.sql — drop dbo.ArchitectureInventoryBindings.
*/

IF OBJECT_ID(N'dbo.ArchitectureInventoryBindings', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.ArchitectureInventoryBindings;
END;
GO
