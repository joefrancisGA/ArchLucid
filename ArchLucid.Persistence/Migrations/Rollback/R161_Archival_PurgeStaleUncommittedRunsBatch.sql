/*
  Rollback 161: remove dbo.Archival_PurgeStaleUncommittedRunsBatch (introduced in 161_Archival_PurgeStaleUncommittedRunsBatch.sql).
*/

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.Archival_PurgeStaleUncommittedRunsBatch', N'P') IS NOT NULL
BEGIN
    REVOKE EXECUTE ON OBJECT::dbo.Archival_PurgeStaleUncommittedRunsBatch TO [ArchLucidApp];
END;
GO

IF OBJECT_ID(N'dbo.Archival_PurgeStaleUncommittedRunsBatch', N'P') IS NOT NULL
    DROP PROCEDURE dbo.Archival_PurgeStaleUncommittedRunsBatch;
GO
