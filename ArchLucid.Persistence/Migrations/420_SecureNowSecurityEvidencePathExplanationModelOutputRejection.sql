/*
  420: SecureNow architect — retain the reason a live path explanation fell back to stored evidence.
*/

SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.SecurityEvidencePathExplanations', N'ModelOutputRejection') IS NULL
BEGIN
    ALTER TABLE dbo.SecurityEvidencePathExplanations
        ADD ModelOutputRejection NVARCHAR(512) NULL;
END;
GO
