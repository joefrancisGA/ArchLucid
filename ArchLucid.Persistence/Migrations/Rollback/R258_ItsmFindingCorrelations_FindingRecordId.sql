IF OBJECT_ID(N'dbo.ItsmFindingCorrelations', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = N'FK_ItsmFindingCorrelations_FindingRecords'
          AND parent_object_id = OBJECT_ID(N'dbo.ItsmFindingCorrelations'))
    BEGIN
        ALTER TABLE dbo.ItsmFindingCorrelations
            DROP CONSTRAINT FK_ItsmFindingCorrelations_FindingRecords;
    END;

    IF COL_LENGTH(N'dbo.ItsmFindingCorrelations', N'FindingRecordId') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.ItsmFindingCorrelations
            DROP COLUMN FindingRecordId;
    END;
END;
GO
