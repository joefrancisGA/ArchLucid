/*
  R375: Rollback 375_PurgeReviewsAndArchitectures.sql — drop operator purge proc.
  To restore prior PurgeCascade_Core body, re-apply 218_PurgeCascadeCore.sql.
*/

IF OBJECT_ID(N'dbo.usp_ArchLucid_PurgeReviewsAndArchitectures', N'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_ArchLucid_PurgeReviewsAndArchitectures;
GO
