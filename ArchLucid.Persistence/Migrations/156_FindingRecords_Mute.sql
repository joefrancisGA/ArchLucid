/* DbUp 156: operator mute flags on durable finding rows (scoped via RLS on FindingRecords). */
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingRecords', N'IsMuted') IS NULL
    BEGIN
        ALTER TABLE dbo.FindingRecords
            ADD IsMuted BIT NOT NULL
                CONSTRAINT DF_FindingRecords_IsMuted DEFAULT (0);
    END;

    IF COL_LENGTH(N'dbo.FindingRecords', N'MuteReason') IS NULL
    BEGIN
        ALTER TABLE dbo.FindingRecords ADD MuteReason NVARCHAR(2000) NULL;
    END;
END;
