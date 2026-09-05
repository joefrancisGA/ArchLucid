/*
  Rollback 354: drop HasherBoundJson from the physical golden-manifest table.
*/

SET NOCOUNT ON;
GO

DECLARE @manifestTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.SignedReviewRecords', N'U') IS NOT NULL THEN N'dbo.SignedReviewRecords'
        WHEN OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL THEN N'dbo.GoldenManifests'
    END;

IF @manifestTable IS NOT NULL
   AND COL_LENGTH(@manifestTable, N'HasherBoundJson') IS NOT NULL
BEGIN
    DECLARE @dropHasherBoundSql NVARCHAR(MAX) =
        N'ALTER TABLE ' + @manifestTable + N' DROP COLUMN HasherBoundJson;';

    EXEC sp_executesql @dropHasherBoundSql;
END
GO
