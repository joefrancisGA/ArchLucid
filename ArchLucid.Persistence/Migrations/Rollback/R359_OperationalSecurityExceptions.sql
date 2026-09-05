/*
  Rollback 359: Operational security exceptions (IE-12).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.OperationalSecurityExceptions', N'U') IS NOT NULL
    DROP TABLE dbo.OperationalSecurityExceptions;
GO
