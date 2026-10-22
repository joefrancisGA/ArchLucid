/*
  258: TB-390 — scope ITSM inbound HumanReviewStatus sync to the correlated FindingRecords row.
*/

IF OBJECT_ID(N'dbo.ItsmFindingCorrelations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ItsmFindingCorrelations', N'FindingRecordId') IS NULL
BEGIN
    ALTER TABLE dbo.ItsmFindingCorrelations
        ADD FindingRecordId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.ItsmFindingCorrelations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ItsmFindingCorrelations', N'FindingRecordId') IS NOT NULL
   AND OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = N'FK_ItsmFindingCorrelations_FindingRecords'
          AND parent_object_id = OBJECT_ID(N'dbo.ItsmFindingCorrelations'))
BEGIN
    ALTER TABLE dbo.ItsmFindingCorrelations
        ADD CONSTRAINT FK_ItsmFindingCorrelations_FindingRecords
            FOREIGN KEY (FindingRecordId) REFERENCES dbo.FindingRecords (FindingRecordId)
            ON DELETE SET NULL;
END;
GO
