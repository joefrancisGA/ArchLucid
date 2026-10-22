/*
  R397: Drop the human-declared security connection table and its indexes.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityDeclaredConnections', N'U') IS NOT NULL
    DROP TABLE dbo.SecurityDeclaredConnections;
GO
