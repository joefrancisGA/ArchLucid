/*
  R303: Rollback 303_RunExecuteOwnershipLeases.sql —
  drop execute ownership lease table (TB-943 / TB-961).
*/

IF OBJECT_ID(N'dbo.RunExecuteOwnershipLeases', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_RunExecuteOwnershipLeases_LeaseExpiresUtc'
         AND object_id = OBJECT_ID(N'dbo.RunExecuteOwnershipLeases'))
BEGIN
    DROP INDEX IX_RunExecuteOwnershipLeases_LeaseExpiresUtc ON dbo.RunExecuteOwnershipLeases;
END
GO

IF OBJECT_ID(N'dbo.RunExecuteOwnershipLeases', N'U') IS NOT NULL
    DROP TABLE dbo.RunExecuteOwnershipLeases;
GO
