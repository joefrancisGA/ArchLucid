/*
  Rollback 405: SecureNow question dispositions.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecureNowQuestionDispositions', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.SecureNowQuestionDispositions;
END;
GO
