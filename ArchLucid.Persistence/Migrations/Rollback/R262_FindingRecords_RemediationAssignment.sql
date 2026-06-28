/* Rollback DbUp 262 — remove remediation assignment columns from FindingRecords. */
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingRecords', N'RemediationDueUtc') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.FindingRecords DROP COLUMN RemediationDueUtc;
    END;

    IF COL_LENGTH(N'dbo.FindingRecords', N'AssignedToUserId') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.FindingRecords DROP COLUMN AssignedToUserId;
    END;
END;
