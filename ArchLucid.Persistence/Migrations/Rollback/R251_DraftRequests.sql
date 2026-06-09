/*
  R251: Rollback 251_DraftRequests.sql — drop mutable Socratic intake draft storage.
*/

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.DraftRequests;
END;
GO
