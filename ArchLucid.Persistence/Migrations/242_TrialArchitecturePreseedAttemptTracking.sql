-- Trial architecture preseed failure cap and last-error tracking (TB-258).

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'TrialArchitecturePreseedAttemptCount') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD
        TrialArchitecturePreseedAttemptCount INT NOT NULL
            CONSTRAINT DF_Tenants_TrialArchitecturePreseedAttemptCount DEFAULT (0),
        TrialArchitecturePreseedFailedUtc DATETIMEOFFSET NULL,
        TrialArchitecturePreseedLastError NVARCHAR(2048) NULL;
END;
GO
