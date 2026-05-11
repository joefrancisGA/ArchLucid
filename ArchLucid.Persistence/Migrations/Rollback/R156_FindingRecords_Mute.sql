/* Rollback DbUp 156 — remove mute columns from FindingRecords. */
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingRecords', N'MuteReason') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.FindingRecords DROP COLUMN MuteReason;
    END;

    IF COL_LENGTH(N'dbo.FindingRecords', N'IsMuted') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.FindingRecords DROP CONSTRAINT DF_FindingRecords_IsMuted;
        ALTER TABLE dbo.FindingRecords DROP COLUMN IsMuted;
    END;
END;
