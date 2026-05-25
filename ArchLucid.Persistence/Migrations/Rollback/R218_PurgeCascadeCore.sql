/*
  Rollback Improvement #37 — restore inline cascade bodies (re-apply migrations 161 and 195).
*/

IF OBJECT_ID(N'dbo.PurgeCascade_Core', N'P') IS NOT NULL
    DROP PROCEDURE dbo.PurgeCascade_Core;
GO
