/*
  307: Quick Scan usage records + budget reconciliation helpers (TB-899).
*/

SET XACT_ABORT ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'QuickScanUsageRecords' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.QuickScanUsageRecords
    (
        UsageId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_QuickScanUsageRecords PRIMARY KEY,
        ReservationId     UNIQUEIDENTIFIER NULL,
        Status            NVARCHAR(32)     NOT NULL,
        RouteKind         NVARCHAR(32)     NOT NULL,
        ClientIpHash      NVARCHAR(16)     NOT NULL,
        SessionIdHash     NVARCHAR(16)     NOT NULL,
        ReservedUsd       DECIMAL(18, 6)   NULL,
        ActualCostUsd     DECIMAL(18, 6)   NULL,
        InputTokens       INT              NULL,
        OutputTokens      INT              NULL,
        ModelLabel        NVARCHAR(128)    NULL,
        RejectionReason   NVARCHAR(256)    NULL,
        DurationMs        INT              NOT NULL CONSTRAINT DF_QuickScanUsageRecords_DurationMs DEFAULT (0),
        OccurredUtc       DATETIMEOFFSET   NOT NULL CONSTRAINT DF_QuickScanUsageRecords_OccurredUtc DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_QuickScanUsageRecords_OccurredUtc
        ON dbo.QuickScanUsageRecords (OccurredUtc DESC);
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_QuickScanBudget_GetSnapshot
    @HourBucketKey NVARCHAR(16),
    @DayBucketKey NVARCHAR(8)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @HourReserved DECIMAL(18, 6) = 0;
    DECLARE @HourCommitted DECIMAL(18, 6) = 0;
    DECLARE @DayReserved DECIMAL(18, 6) = 0;
    DECLARE @DayCommitted DECIMAL(18, 6) = 0;

    SELECT @HourReserved = ReservedUsd, @HourCommitted = CommittedUsd
    FROM dbo.QuickScanGlobalBudgetBuckets
    WHERE BucketKind = 1 AND BucketKey = @HourBucketKey;

    SELECT @DayReserved = ReservedUsd, @DayCommitted = CommittedUsd
    FROM dbo.QuickScanGlobalBudgetBuckets
    WHERE BucketKind = 2 AND BucketKey = @DayBucketKey;

    DECLARE @PendingCount INT = (
        SELECT COUNT(1)
        FROM dbo.QuickScanGlobalBudgetReservations
        WHERE Status = 0);

    DECLARE @ExpiredPendingCount INT = (
        SELECT COUNT(1)
        FROM dbo.QuickScanGlobalBudgetReservations
        WHERE Status = 0 AND ExpiresUtc < SYSUTCDATETIME());

    SELECT
        @HourBucketKey AS HourBucketKey,
        @DayBucketKey AS DayBucketKey,
        ISNULL(@HourReserved, 0) AS HourReservedUsd,
        ISNULL(@HourCommitted, 0) AS HourCommittedUsd,
        ISNULL(@DayReserved, 0) AS DayReservedUsd,
        ISNULL(@DayCommitted, 0) AS DayCommittedUsd,
        @PendingCount AS PendingReservationCount,
        @ExpiredPendingCount AS ExpiredPendingReservationCount;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_QuickScanBudget_ReconcileExpired
    @UtcNow DATETIME2,
    @ExpiredCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ExpiredCount = 0;

    DECLARE @ReservationId UNIQUEIDENTIFIER;
    DECLARE @HourBucketKey NVARCHAR(16);
    DECLARE @DayBucketKey NVARCHAR(8);
    DECLARE @ReservedUsd DECIMAL(18, 6);

    DECLARE expired_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT ReservationId, HourBucketKey, DayBucketKey, ReservedUsd
        FROM dbo.QuickScanGlobalBudgetReservations WITH (UPDLOCK, ROWLOCK)
        WHERE Status = 0 AND ExpiresUtc < @UtcNow;

    OPEN expired_cursor;

    FETCH NEXT FROM expired_cursor INTO @ReservationId, @HourBucketKey, @DayBucketKey, @ReservedUsd;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        BEGIN TRANSACTION;

        UPDATE dbo.QuickScanGlobalBudgetBuckets
        SET ReservedUsd = CASE WHEN ReservedUsd > @ReservedUsd THEN ReservedUsd - @ReservedUsd ELSE 0 END,
            UpdatedUtc = SYSUTCDATETIME()
        WHERE (BucketKind = 1 AND BucketKey = @HourBucketKey)
           OR (BucketKind = 2 AND BucketKey = @DayBucketKey);

        UPDATE dbo.QuickScanGlobalBudgetReservations
        SET Status = 3
        WHERE ReservationId = @ReservationId AND Status = 0;

        IF @@ROWCOUNT > 0
        BEGIN
            SET @ExpiredCount = @ExpiredCount + 1;
        END

        COMMIT TRANSACTION;

        FETCH NEXT FROM expired_cursor INTO @ReservationId, @HourBucketKey, @DayBucketKey, @ReservedUsd;
    END

    CLOSE expired_cursor;
    DEALLOCATE expired_cursor;
END;
GO
