/*
  ArchLucid.Master.sql — master-database DDL (development catalog lifecycle).

  Single DDL file for the SQL Server [master] catalog. Not applied by DbUp
  (tenant/system planes). The Development API host deploys this script onto
  master, then the UI reset path executes the procedure.

  SSMS:
    1. Connect to the master database (not ArchLucid).
    2. Set query execution timeout to 0 (unlimited) or at least 600 seconds
       (Tools > Options > Query Execution > SQL Server > General).
    3. EXEC dbo.usp_ArchLucid_ResetDevelopmentCatalog
           @DatabaseName = N'ArchLucid',
           @Confirm = N'RESET';
    4. Restart the ArchLucid API host so migrations, schema bootstrap,
       default scope rows, and optional demo seed replay on the empty catalog.

  The UI "Reset Database" button calls this procedure, then continues with
  those application steps in-process (no restart required).
*/

CREATE OR ALTER PROCEDURE dbo.usp_ArchLucid_ResetDevelopmentCatalog
    @DatabaseName SYSNAME,
    @Confirm NVARCHAR(32)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Confirm IS NULL OR @Confirm <> N'RESET'
    BEGIN
        THROW 50001, N'Pass @Confirm = N''RESET'' to drop and recreate the development catalog.', 1;
    END;

    IF @DatabaseName IS NULL OR LTRIM(RTRIM(CONVERT(nvarchar(128), @DatabaseName))) = N''
    BEGIN
        THROW 50002, N'@DatabaseName is required.', 1;
    END;

    IF LOWER(CONVERT(nvarchar(128), @DatabaseName)) IN (N'master', N'tempdb', N'model', N'msdb')
    BEGIN
        THROW 50003, N'Refusing to drop a SQL Server system database.', 1;
    END;

    DECLARE @quoted nvarchar(258) = QUOTENAME(@DatabaseName);

    IF EXISTS (SELECT 1 FROM sys.databases WHERE name = @DatabaseName)
    BEGIN
        DECLARE @alter nvarchar(max) = N'ALTER DATABASE ' + @quoted + N' SET SINGLE_USER WITH ROLLBACK IMMEDIATE';
        EXEC sys.sp_executesql @alter;

        DECLARE @drop nvarchar(max) = N'DROP DATABASE ' + @quoted;
        EXEC sys.sp_executesql @drop;
    END;

    DECLARE @create nvarchar(max) = N'CREATE DATABASE ' + @quoted;
    EXEC sys.sp_executesql @create;

    SELECT
        @DatabaseName AS CatalogName,
        N'Restart the ArchLucid API host (or use Reset Database in the UI) so migrations, schema bootstrap, default scope rows, and optional demo seed replay.' AS NextStep;
END;
GO
