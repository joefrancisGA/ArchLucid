-- TB-897: Distributed anonymous Quick Scan identity/abuse counters and content-hash duplicates.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'QuickScanIdentityAbuseCounters' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.QuickScanIdentityAbuseCounters
    (
        CounterKey NVARCHAR(160) NOT NULL,
        HitCount INT NOT NULL,
        CONSTRAINT PK_QuickScanIdentityAbuseCounters PRIMARY KEY (CounterKey),
        CONSTRAINT CK_QuickScanIdentityAbuseCounters_HitCount CHECK (HitCount >= 0)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'QuickScanIdentityAbusePayloads' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.QuickScanIdentityAbusePayloads
    (
        ContentHash CHAR(64) NOT NULL,
        FirstSeenUtc DATETIME2 NOT NULL,
        LastSeenUtc DATETIME2 NOT NULL,
        CONSTRAINT PK_QuickScanIdentityAbusePayloads PRIMARY KEY (ContentHash)
    );

    CREATE INDEX IX_QuickScanIdentityAbusePayloads_LastSeenUtc
        ON dbo.QuickScanIdentityAbusePayloads (LastSeenUtc);
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_QuickScanIdentityAbuse_TryAdmit
    @SessionHourKey NVARCHAR(160),
    @SessionDayKey NVARCHAR(160),
    @BrowserHourKey NVARCHAR(160),
    @BrowserDayKey NVARCHAR(160),
    @IpHourKey NVARCHAR(160),
    @IpDayKey NVARCHAR(160),
    @IpRangeHourKey NVARCHAR(160),
    @IpRangeDayKey NVARCHAR(160),
    @GlobalHourKey NVARCHAR(160),
    @GlobalDayKey NVARCHAR(160),
    @BurstMinuteKey NVARCHAR(160),
    @BurstFiveMinuteKey NVARCHAR(160),
    @ContentHash CHAR(64),
    @UtcNow DATETIME2,
    @DuplicateWindowSeconds INT,
    @MaxSessionHour INT,
    @MaxSessionDay INT,
    @MaxBrowserHour INT,
    @MaxBrowserDay INT,
    @MaxIpHour INT,
    @MaxIpDay INT,
    @MaxIpRangeHour INT,
    @MaxIpRangeDay INT,
    @MaxGlobalHour INT,
    @MaxGlobalDay INT,
    @MaxBurstMinute INT,
    @MaxBurstFiveMinutes INT,
    @SignInAfterSessionScans INT,
    @CaptchaAfterSessionScans INT,
    @CaptchaSatisfied BIT,
    @DryRun BIT,
    @Outcome TINYINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @Outcome = 1; -- RateLimited default

    BEGIN TRANSACTION;

    DECLARE @DuplicateCutoff DATETIME2 = DATEADD(SECOND, -@DuplicateWindowSeconds, @UtcNow);

    IF @DuplicateWindowSeconds > 0
       AND EXISTS (
            SELECT 1
            FROM dbo.QuickScanIdentityAbusePayloads WITH (UPDLOCK, HOLDLOCK)
            WHERE ContentHash = @ContentHash
              AND LastSeenUtc >= @DuplicateCutoff)
    BEGIN
        SET @Outcome = 2; -- Duplicate
        ROLLBACK TRANSACTION;
        RETURN;
    END

    DECLARE @BurstMinuteCount INT = ISNULL((SELECT HitCount FROM dbo.QuickScanIdentityAbuseCounters WITH (UPDLOCK, HOLDLOCK) WHERE CounterKey = @BurstMinuteKey), 0);
    DECLARE @BurstFiveCount INT = ISNULL((SELECT HitCount FROM dbo.QuickScanIdentityAbuseCounters WITH (UPDLOCK, HOLDLOCK) WHERE CounterKey = @BurstFiveMinuteKey), 0);

    IF @BurstMinuteCount >= @MaxBurstMinute OR @BurstFiveCount >= @MaxBurstFiveMinutes
    BEGIN
        SET @Outcome = 3; -- Suspicious
        ROLLBACK TRANSACTION;
        RETURN;
    END

    DECLARE @SessionDayCount INT = ISNULL((SELECT HitCount FROM dbo.QuickScanIdentityAbuseCounters WITH (UPDLOCK, HOLDLOCK) WHERE CounterKey = @SessionDayKey), 0);

    IF @SignInAfterSessionScans > 0 AND @SessionDayCount >= @SignInAfterSessionScans
    BEGIN
        SET @Outcome = 4; -- SignInRequired
        ROLLBACK TRANSACTION;
        RETURN;
    END

    IF @CaptchaAfterSessionScans > 0
       AND @CaptchaSatisfied = 0
       AND @SessionDayCount >= @CaptchaAfterSessionScans
    BEGIN
        SET @Outcome = 5; -- CaptchaRequired
        ROLLBACK TRANSACTION;
        RETURN;
    END

    DECLARE @SessionHourCount INT = ISNULL((SELECT HitCount FROM dbo.QuickScanIdentityAbuseCounters WITH (UPDLOCK, HOLDLOCK) WHERE CounterKey = @SessionHourKey), 0);
    DECLARE @BrowserHourCount INT = ISNULL((SELECT HitCount FROM dbo.QuickScanIdentityAbuseCounters WITH (UPDLOCK, HOLDLOCK) WHERE CounterKey = @BrowserHourKey), 0);
    DECLARE @BrowserDayCount INT = ISNULL((SELECT HitCount FROM dbo.QuickScanIdentityAbuseCounters WITH (UPDLOCK, HOLDLOCK) WHERE CounterKey = @BrowserDayKey), 0);
    DECLARE @IpHourCount INT = ISNULL((SELECT HitCount FROM dbo.QuickScanIdentityAbuseCounters WITH (UPDLOCK, HOLDLOCK) WHERE CounterKey = @IpHourKey), 0);
    DECLARE @IpDayCount INT = ISNULL((SELECT HitCount FROM dbo.QuickScanIdentityAbuseCounters WITH (UPDLOCK, HOLDLOCK) WHERE CounterKey = @IpDayKey), 0);
    DECLARE @IpRangeHourCount INT = ISNULL((SELECT HitCount FROM dbo.QuickScanIdentityAbuseCounters WITH (UPDLOCK, HOLDLOCK) WHERE CounterKey = @IpRangeHourKey), 0);
    DECLARE @IpRangeDayCount INT = ISNULL((SELECT HitCount FROM dbo.QuickScanIdentityAbuseCounters WITH (UPDLOCK, HOLDLOCK) WHERE CounterKey = @IpRangeDayKey), 0);
    DECLARE @GlobalHourCount INT = ISNULL((SELECT HitCount FROM dbo.QuickScanIdentityAbuseCounters WITH (UPDLOCK, HOLDLOCK) WHERE CounterKey = @GlobalHourKey), 0);
    DECLARE @GlobalDayCount INT = ISNULL((SELECT HitCount FROM dbo.QuickScanIdentityAbuseCounters WITH (UPDLOCK, HOLDLOCK) WHERE CounterKey = @GlobalDayKey), 0);

    IF @SessionHourCount >= @MaxSessionHour
       OR @SessionDayCount >= @MaxSessionDay
       OR @BrowserHourCount >= @MaxBrowserHour
       OR @BrowserDayCount >= @MaxBrowserDay
       OR @IpHourCount >= @MaxIpHour
       OR @IpDayCount >= @MaxIpDay
       OR @IpRangeHourCount >= @MaxIpRangeHour
       OR @IpRangeDayCount >= @MaxIpRangeDay
       OR @GlobalHourCount >= @MaxGlobalHour
       OR @GlobalDayCount >= @MaxGlobalDay
    BEGIN
        SET @Outcome = 1; -- RateLimited
        ROLLBACK TRANSACTION;
        RETURN;
    END

    IF @DryRun = 1
    BEGIN
        SET @Outcome = 0; -- Admitted (probe only)
        ROLLBACK TRANSACTION;
        RETURN;
    END

    MERGE dbo.QuickScanIdentityAbuseCounters AS target
    USING (VALUES
        (@SessionHourKey), (@SessionDayKey), (@BrowserHourKey), (@BrowserDayKey),
        (@IpHourKey), (@IpDayKey), (@IpRangeHourKey), (@IpRangeDayKey),
        (@GlobalHourKey), (@GlobalDayKey), (@BurstMinuteKey), (@BurstFiveMinuteKey)
    ) AS source(CounterKey)
    ON target.CounterKey = source.CounterKey
    WHEN MATCHED THEN UPDATE SET HitCount = target.HitCount + 1
    WHEN NOT MATCHED THEN INSERT (CounterKey, HitCount) VALUES (source.CounterKey, 1);

    MERGE dbo.QuickScanIdentityAbusePayloads AS target
    USING (SELECT @ContentHash AS ContentHash) AS source
    ON target.ContentHash = source.ContentHash
    WHEN MATCHED THEN UPDATE SET LastSeenUtc = @UtcNow
    WHEN NOT MATCHED THEN INSERT (ContentHash, FirstSeenUtc, LastSeenUtc)
        VALUES (@ContentHash, @UtcNow, @UtcNow);

    SET @Outcome = 0; -- Admitted
    COMMIT TRANSACTION;
END
GO
