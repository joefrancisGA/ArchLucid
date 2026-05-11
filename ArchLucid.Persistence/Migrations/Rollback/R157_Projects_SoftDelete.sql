/* Rollback 157: drop dbo.Projects (tenant-scoped architecture project registry). */
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL
    DROP TABLE dbo.Projects;
GO
