/*
  R186: Rollback 186_FindingFeedback_Comment.sql — remove optional operator comment column.
*/

IF OBJECT_ID(N'dbo.FindingFeedback', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingFeedback', N'Comment') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FindingFeedback DROP COLUMN Comment;
END;
GO
