/*
  186: Optional operator comment on per-finding thumbs feedback.
*/
IF OBJECT_ID(N'dbo.FindingFeedback', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingFeedback', N'Comment') IS NULL
BEGIN
    ALTER TABLE dbo.FindingFeedback
        ADD Comment NVARCHAR(2000) NULL;
END;
GO
