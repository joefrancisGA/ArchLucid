-- TB-894: shared atomic Quick Scan global hourly/daily budget reservations.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'QuickScanGlobalBudgetBuckets' AND schema_id = SCHEMA_ID('dbo'))

BEGIN

    CREATE TABLE dbo.QuickScanGlobalBudgetBuckets

    (

        BucketKind TINYINT NOT NULL,

        BucketKey NVARCHAR(16) NOT NULL,

        ReservedUsd DECIMAL(18, 6) NOT NULL CONSTRAINT DF_QuickScanGlobalBudgetBuckets_ReservedUsd DEFAULT (0),

        CommittedUsd DECIMAL(18, 6) NOT NULL CONSTRAINT DF_QuickScanGlobalBudgetBuckets_CommittedUsd DEFAULT (0),

        UpdatedUtc DATETIME2 NOT NULL CONSTRAINT DF_QuickScanGlobalBudgetBuckets_UpdatedUtc DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_QuickScanGlobalBudgetBuckets PRIMARY KEY (BucketKind, BucketKey),

        CONSTRAINT CK_QuickScanGlobalBudgetBuckets_BucketKind CHECK (BucketKind IN (1, 2))

    );

END

GO



IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'QuickScanGlobalBudgetReservations' AND schema_id = SCHEMA_ID('dbo'))

BEGIN

    CREATE TABLE dbo.QuickScanGlobalBudgetReservations

    (

        ReservationId UNIQUEIDENTIFIER NOT NULL,

        IdempotencyKeyHash VARBINARY(32) NOT NULL,

        HourBucketKey NVARCHAR(16) NOT NULL,

        DayBucketKey NVARCHAR(8) NOT NULL,

        ReservedUsd DECIMAL(18, 6) NOT NULL,

        CommittedUsd DECIMAL(18, 6) NULL,

        Status TINYINT NOT NULL,

        Currency CHAR(3) NOT NULL CONSTRAINT DF_QuickScanGlobalBudgetReservations_Currency DEFAULT ('USD'),

        CreatedUtc DATETIME2 NOT NULL CONSTRAINT DF_QuickScanGlobalBudgetReservations_CreatedUtc DEFAULT (SYSUTCDATETIME()),

        ExpiresUtc DATETIME2 NOT NULL,

        CONSTRAINT PK_QuickScanGlobalBudgetReservations PRIMARY KEY (ReservationId),

        CONSTRAINT UQ_QuickScanGlobalBudgetReservations_Idempotency UNIQUE (IdempotencyKeyHash)

    );

END

GO



CREATE OR ALTER PROCEDURE dbo.usp_QuickScanGlobalBudget_TryReserve

    @ReservationId UNIQUEIDENTIFIER,

    @IdempotencyKeyHash VARBINARY(32),

    @HourBucketKey NVARCHAR(16),

    @DayBucketKey NVARCHAR(8),

    @ReserveUsd DECIMAL(18, 6),

    @MaxHourUsd DECIMAL(18, 6),

    @MaxDayUsd DECIMAL(18, 6),

    @ExpiresUtc DATETIME2,

    @Allowed BIT OUTPUT,

    @ReservationIdOut UNIQUEIDENTIFIER OUTPUT

AS

BEGIN

    SET NOCOUNT ON;

    SET XACT_ABORT ON;



    SET @Allowed = 0;

    SET @ReservationIdOut = @ReservationId;



    BEGIN TRANSACTION;



    ;WITH ExpiredHour AS

    (

        SELECT HourBucketKey, SUM(ReservedUsd) AS ReleaseUsd

        FROM dbo.QuickScanGlobalBudgetReservations

        WHERE Status = 0 AND ExpiresUtc <= SYSUTCDATETIME()

        GROUP BY HourBucketKey

    )

    UPDATE b

    SET ReservedUsd = CASE WHEN b.ReservedUsd > e.ReleaseUsd THEN b.ReservedUsd - e.ReleaseUsd ELSE 0 END,

        UpdatedUtc = SYSUTCDATETIME()

    FROM dbo.QuickScanGlobalBudgetBuckets b

    INNER JOIN ExpiredHour e ON b.BucketKind = 1 AND b.BucketKey = e.HourBucketKey;



    ;WITH ExpiredDay AS

    (

        SELECT DayBucketKey, SUM(ReservedUsd) AS ReleaseUsd

        FROM dbo.QuickScanGlobalBudgetReservations

        WHERE Status = 0 AND ExpiresUtc <= SYSUTCDATETIME()

        GROUP BY DayBucketKey

    )

    UPDATE b

    SET ReservedUsd = CASE WHEN b.ReservedUsd > e.ReleaseUsd THEN b.ReservedUsd - e.ReleaseUsd ELSE 0 END,

        UpdatedUtc = SYSUTCDATETIME()

    FROM dbo.QuickScanGlobalBudgetBuckets b

    INNER JOIN ExpiredDay e ON b.BucketKind = 2 AND b.BucketKey = e.DayBucketKey;



    UPDATE dbo.QuickScanGlobalBudgetReservations

    SET Status = 3

    WHERE Status = 0 AND ExpiresUtc <= SYSUTCDATETIME();



    DECLARE @ExistingReservationId UNIQUEIDENTIFIER;



    SELECT @ExistingReservationId = ReservationId

    FROM dbo.QuickScanGlobalBudgetReservations WITH (UPDLOCK, HOLDLOCK)

    WHERE IdempotencyKeyHash = @IdempotencyKeyHash

      AND Status = 0

      AND ExpiresUtc > SYSUTCDATETIME();



    IF @ExistingReservationId IS NOT NULL

    BEGIN

        SET @Allowed = 1;

        SET @ReservationIdOut = @ExistingReservationId;

        COMMIT TRANSACTION;



        RETURN;

    END



    IF NOT EXISTS (SELECT 1 FROM dbo.QuickScanGlobalBudgetBuckets WITH (UPDLOCK, HOLDLOCK) WHERE BucketKind = 1 AND BucketKey = @HourBucketKey)

    BEGIN

        INSERT INTO dbo.QuickScanGlobalBudgetBuckets (BucketKind, BucketKey, ReservedUsd, CommittedUsd, UpdatedUtc)

        VALUES (1, @HourBucketKey, 0, 0, SYSUTCDATETIME());

    END



    IF NOT EXISTS (SELECT 1 FROM dbo.QuickScanGlobalBudgetBuckets WITH (UPDLOCK, HOLDLOCK) WHERE BucketKind = 2 AND BucketKey = @DayBucketKey)

    BEGIN

        INSERT INTO dbo.QuickScanGlobalBudgetBuckets (BucketKind, BucketKey, ReservedUsd, CommittedUsd, UpdatedUtc)

        VALUES (2, @DayBucketKey, 0, 0, SYSUTCDATETIME());

    END



    DECLARE @HourReserved DECIMAL(18, 6);

    DECLARE @DayReserved DECIMAL(18, 6);

    DECLARE @HourCommitted DECIMAL(18, 6);

    DECLARE @DayCommitted DECIMAL(18, 6);



    SELECT @HourReserved = ReservedUsd, @HourCommitted = CommittedUsd

    FROM dbo.QuickScanGlobalBudgetBuckets WITH (UPDLOCK, ROWLOCK)

    WHERE BucketKind = 1 AND BucketKey = @HourBucketKey;



    SELECT @DayReserved = ReservedUsd, @DayCommitted = CommittedUsd

    FROM dbo.QuickScanGlobalBudgetBuckets WITH (UPDLOCK, ROWLOCK)

    WHERE BucketKind = 2 AND BucketKey = @DayBucketKey;



    IF ((@HourReserved + @HourCommitted + @ReserveUsd) > @MaxHourUsd)

        OR ((@DayReserved + @DayCommitted + @ReserveUsd) > @MaxDayUsd)

    BEGIN

        ROLLBACK TRANSACTION;



        RETURN;

    END



    UPDATE dbo.QuickScanGlobalBudgetBuckets

    SET ReservedUsd = ReservedUsd + @ReserveUsd,

        UpdatedUtc = SYSUTCDATETIME()

    WHERE BucketKind = 1 AND BucketKey = @HourBucketKey;



    UPDATE dbo.QuickScanGlobalBudgetBuckets

    SET ReservedUsd = ReservedUsd + @ReserveUsd,

        UpdatedUtc = SYSUTCDATETIME()

    WHERE BucketKind = 2 AND BucketKey = @DayBucketKey;



    INSERT INTO dbo.QuickScanGlobalBudgetReservations

    (

        ReservationId,

        IdempotencyKeyHash,

        HourBucketKey,

        DayBucketKey,

        ReservedUsd,

        Status,

        ExpiresUtc

    )

    VALUES

    (

        @ReservationId,

        @IdempotencyKeyHash,

        @HourBucketKey,

        @DayBucketKey,

        @ReserveUsd,

        0,

        @ExpiresUtc

    );



    SET @Allowed = 1;

    SET @ReservationIdOut = @ReservationId;

    COMMIT TRANSACTION;

END

GO



CREATE OR ALTER PROCEDURE dbo.usp_QuickScanGlobalBudget_Commit

    @ReservationId UNIQUEIDENTIFIER,

    @ActualUsd DECIMAL(18, 6)

AS

BEGIN

    SET NOCOUNT ON;

    SET XACT_ABORT ON;



    BEGIN TRANSACTION;



    DECLARE @HourBucketKey NVARCHAR(16);

    DECLARE @DayBucketKey NVARCHAR(8);

    DECLARE @ReservedUsd DECIMAL(18, 6);

    DECLARE @Status TINYINT;



    SELECT

        @HourBucketKey = HourBucketKey,

        @DayBucketKey = DayBucketKey,

        @ReservedUsd = ReservedUsd,

        @Status = Status

    FROM dbo.QuickScanGlobalBudgetReservations WITH (UPDLOCK, ROWLOCK)

    WHERE ReservationId = @ReservationId;



    IF @Status IS NULL OR @Status <> 0

    BEGIN

        COMMIT TRANSACTION;



        RETURN;

    END



    DECLARE @ReleaseUsd DECIMAL(18, 6) = @ReservedUsd;



    UPDATE dbo.QuickScanGlobalBudgetBuckets

    SET ReservedUsd = CASE WHEN ReservedUsd > @ReleaseUsd THEN ReservedUsd - @ReleaseUsd ELSE 0 END,

        CommittedUsd = CommittedUsd + @ActualUsd,

        UpdatedUtc = SYSUTCDATETIME()

    WHERE (BucketKind = 1 AND BucketKey = @HourBucketKey)

       OR (BucketKind = 2 AND BucketKey = @DayBucketKey);



    UPDATE dbo.QuickScanGlobalBudgetReservations

    SET Status = 1,

        CommittedUsd = @ActualUsd

    WHERE ReservationId = @ReservationId;



    COMMIT TRANSACTION;

END

GO



CREATE OR ALTER PROCEDURE dbo.usp_QuickScanGlobalBudget_Release

    @ReservationId UNIQUEIDENTIFIER

AS

BEGIN

    SET NOCOUNT ON;

    SET XACT_ABORT ON;



    BEGIN TRANSACTION;



    DECLARE @HourBucketKey NVARCHAR(16);

    DECLARE @DayBucketKey NVARCHAR(8);

    DECLARE @ReservedUsd DECIMAL(18, 6);

    DECLARE @Status TINYINT;



    SELECT

        @HourBucketKey = HourBucketKey,

        @DayBucketKey = DayBucketKey,

        @ReservedUsd = ReservedUsd,

        @Status = Status

    FROM dbo.QuickScanGlobalBudgetReservations WITH (UPDLOCK, ROWLOCK)

    WHERE ReservationId = @ReservationId;



    IF @Status IS NULL OR @Status <> 0

    BEGIN

        COMMIT TRANSACTION;



        RETURN;

    END



    UPDATE dbo.QuickScanGlobalBudgetBuckets

    SET ReservedUsd = CASE WHEN ReservedUsd > @ReservedUsd THEN ReservedUsd - @ReservedUsd ELSE 0 END,

        UpdatedUtc = SYSUTCDATETIME()

    WHERE (BucketKind = 1 AND BucketKey = @HourBucketKey)

       OR (BucketKind = 2 AND BucketKey = @DayBucketKey);



    UPDATE dbo.QuickScanGlobalBudgetReservations

    SET Status = 2

    WHERE ReservationId = @ReservationId;



    COMMIT TRANSACTION;

END

GO


