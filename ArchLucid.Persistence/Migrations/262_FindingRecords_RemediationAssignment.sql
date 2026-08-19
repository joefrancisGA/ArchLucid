/* DbUp 262: general remediation assignee + due date on durable finding rows (TB-395). */
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingRecords', N'AssignedToUserId') IS NULL
    BEGIN
        ALTER TABLE dbo.FindingRecords ADD AssignedToUserId NVARCHAR(256) NULL;
    END;

    IF COL_LENGTH(N'dbo.FindingRecords', N'RemediationDueUtc') IS NULL
    BEGIN
        ALTER TABLE dbo.FindingRecords ADD RemediationDueUtc DATETIME2(3) NULL;
    END;
END;
