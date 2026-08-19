-- TB-896: Distributed anonymous Quick Scan concurrency leases and bounded queue.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'QuickScanConcurrencyLeases' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.QuickScanConcurrencyLeases
    (
        LeaseId UNIQUEIDENTIFIER NOT NULL,
        QueueEntryId UNIQUEIDENTIFIER NULL,
        HolderInstanceId NVARCHAR(128) NOT NULL,
        AcquiredUtc DATETIME2 NOT NULL,
        ExpiresUtc DATETIME2 NOT NULL,
        Status TINYINT NOT NULL CONSTRAINT DF_QuickScanConcurrencyLeases_Status DEFAULT (0),
        CONSTRAINT PK_QuickScanConcurrencyLeases PRIMARY KEY (LeaseId),
        CONSTRAINT CK_QuickScanConcurrencyLeases_Status CHECK (Status IN (0, 1, 2))
    );

    CREATE INDEX IX_QuickScanConcurrencyLeases_Active
        ON dbo.QuickScanConcurrencyLeases (Status, ExpiresUtc)
        WHERE Status = 0;
END

GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'QuickScanConcurrencyQueue' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.QuickScanConcurrencyQueue
    (
        QueueEntryId UNIQUEIDENTIFIER NOT NULL,
        RequestKey NVARCHAR(128) NOT NULL,
        EnqueuedUtc DATETIME2 NOT NULL,
        QueueExpiresUtc DATETIME2 NOT NULL,
        Status TINYINT NOT NULL CONSTRAINT DF_QuickScanConcurrencyQueue_Status DEFAULT (0),
        CONSTRAINT PK_QuickScanConcurrencyQueue PRIMARY KEY (QueueEntryId),
        CONSTRAINT CK_QuickScanConcurrencyQueue_Status CHECK (Status IN (0, 1, 2, 3, 4))
    );

    CREATE INDEX IX_QuickScanConcurrencyQueue_Waiting
        ON dbo.QuickScanConcurrencyQueue (Status, EnqueuedUtc)
        WHERE Status = 0;
END

GO

CREATE OR ALTER PROCEDURE dbo.usp_QuickScanConcurrency_TryAdmit
    @LeaseId UNIQUEIDENTIFIER,
    @QueueEntryId UNIQUEIDENTIFIER,
    @RequestKey NVARCHAR(128),
    @MaxConcurrent INT,
    @MaxQueued INT,
    @QueueWaitSeconds INT,
    @LeaseDurationSeconds INT,
    @HolderInstanceId NVARCHAR(128),
    @UtcNow DATETIME2,
    @Outcome TINYINT OUTPUT,
    @LeaseIdOut UNIQUEIDENTIFIER OUTPUT,
    @QueueEntryIdOut UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @Outcome = 2;
    SET @LeaseIdOut = @LeaseId;
    SET @QueueEntryIdOut = @QueueEntryId;

    BEGIN TRANSACTION;

    UPDATE dbo.QuickScanConcurrencyLeases
    SET Status = 2
    WHERE Status = 0 AND ExpiresUtc <= @UtcNow;

    UPDATE dbo.QuickScanConcurrencyQueue
    SET Status = 3
    WHERE Status = 0 AND QueueExpiresUtc <= @UtcNow;

    DECLARE @ActiveLeases INT;

    SELECT @ActiveLeases = COUNT(*)
    FROM dbo.QuickScanConcurrencyLeases WITH (UPDLOCK, HOLDLOCK)
    WHERE Status = 0 AND ExpiresUtc > @UtcNow;

    IF @ActiveLeases < @MaxConcurrent
    BEGIN
        INSERT INTO dbo.QuickScanConcurrencyLeases
            (LeaseId, QueueEntryId, HolderInstanceId, AcquiredUtc, ExpiresUtc, Status)
        VALUES
            (@LeaseId, NULL, @HolderInstanceId, @UtcNow, DATEADD(SECOND, @LeaseDurationSeconds, @UtcNow), 0);

        SET @Outcome = 0;
        SET @LeaseIdOut = @LeaseId;
        COMMIT TRANSACTION;
        RETURN;
    END

    IF @MaxQueued <= 0
    BEGIN
        SET @Outcome = 3;
        ROLLBACK TRANSACTION;
        RETURN;
    END

    DECLARE @WaitingCount INT;

    SELECT @WaitingCount = COUNT(*)
    FROM dbo.QuickScanConcurrencyQueue WITH (UPDLOCK, HOLDLOCK)
    WHERE Status = 0 AND QueueExpiresUtc > @UtcNow;

    IF @WaitingCount >= @MaxQueued
    BEGIN
        SET @Outcome = 1;
        ROLLBACK TRANSACTION;
        RETURN;
    END

    INSERT INTO dbo.QuickScanConcurrencyQueue
        (QueueEntryId, RequestKey, EnqueuedUtc, QueueExpiresUtc, Status)
    VALUES
        (@QueueEntryId, @RequestKey, @UtcNow, DATEADD(SECOND, @QueueWaitSeconds, @UtcNow), 0);

    SET @Outcome = 2;
    SET @QueueEntryIdOut = @QueueEntryId;
    COMMIT TRANSACTION;
END

GO

CREATE OR ALTER PROCEDURE dbo.usp_QuickScanConcurrency_TryPromote
    @QueueEntryId UNIQUEIDENTIFIER,
    @LeaseId UNIQUEIDENTIFIER,
    @MaxConcurrent INT,
    @LeaseDurationSeconds INT,
    @HolderInstanceId NVARCHAR(128),
    @UtcNow DATETIME2,
    @Promoted BIT OUTPUT,
    @LeaseIdOut UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @Promoted = 0;
    SET @LeaseIdOut = @LeaseId;

    BEGIN TRANSACTION;

    UPDATE dbo.QuickScanConcurrencyLeases
    SET Status = 2
    WHERE Status = 0 AND ExpiresUtc <= @UtcNow;

    UPDATE dbo.QuickScanConcurrencyQueue
    SET Status = 3
    WHERE Status = 0 AND QueueExpiresUtc <= @UtcNow;

    DECLARE @QueueStatus TINYINT;
    DECLARE @QueueExpiresUtc DATETIME2;

    SELECT @QueueStatus = Status, @QueueExpiresUtc = QueueExpiresUtc
    FROM dbo.QuickScanConcurrencyQueue WITH (UPDLOCK, ROWLOCK)
    WHERE QueueEntryId = @QueueEntryId;

    IF @QueueStatus IS NULL OR @QueueStatus <> 0 OR @QueueExpiresUtc <= @UtcNow
    BEGIN
        COMMIT TRANSACTION;
        RETURN;
    END

    DECLARE @ActiveLeases INT;

    SELECT @ActiveLeases = COUNT(*)
    FROM dbo.QuickScanConcurrencyLeases WITH (UPDLOCK, HOLDLOCK)
    WHERE Status = 0 AND ExpiresUtc > @UtcNow;

    IF @ActiveLeases >= @MaxConcurrent
    BEGIN
        COMMIT TRANSACTION;
        RETURN;
    END

    INSERT INTO dbo.QuickScanConcurrencyLeases
        (LeaseId, QueueEntryId, HolderInstanceId, AcquiredUtc, ExpiresUtc, Status)
    VALUES
        (@LeaseId, @QueueEntryId, @HolderInstanceId, @UtcNow, DATEADD(SECOND, @LeaseDurationSeconds, @UtcNow), 0);

    UPDATE dbo.QuickScanConcurrencyQueue
    SET Status = 1
    WHERE QueueEntryId = @QueueEntryId;

    SET @Promoted = 1;
    SET @LeaseIdOut = @LeaseId;
    COMMIT TRANSACTION;
END

GO

CREATE OR ALTER PROCEDURE dbo.usp_QuickScanConcurrency_ReleaseLease
    @LeaseId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.QuickScanConcurrencyLeases
    SET Status = 1
    WHERE LeaseId = @LeaseId AND Status = 0;
END

GO

CREATE OR ALTER PROCEDURE dbo.usp_QuickScanConcurrency_AbandonQueue
    @QueueEntryId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.QuickScanConcurrencyQueue
    SET Status = 2
    WHERE QueueEntryId = @QueueEntryId AND Status = 0;
END

GO

CREATE OR ALTER PROCEDURE dbo.usp_QuickScanConcurrency_RenewLease
    @LeaseId UNIQUEIDENTIFIER,
    @UtcNow DATETIME2,
    @LeaseDurationSeconds INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.QuickScanConcurrencyLeases
    SET ExpiresUtc = DATEADD(SECOND, @LeaseDurationSeconds, @UtcNow)
    WHERE LeaseId = @LeaseId AND Status = 0 AND ExpiresUtc > @UtcNow;
END

GO
