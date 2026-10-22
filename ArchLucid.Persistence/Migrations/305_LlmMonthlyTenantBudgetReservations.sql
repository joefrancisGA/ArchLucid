-- TB-976: durable per-call monthly tenant USD budget reservation leases + orphan reclaim.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'LlmMonthlyTenantBudgetReservations' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.LlmMonthlyTenantBudgetReservations
    (
        ReservationId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        PeriodKey NVARCHAR(7) NOT NULL,
        ReservedUsd DECIMAL(18, 6) NOT NULL,
        CommittedUsd DECIMAL(18, 6) NULL,
        Status TINYINT NOT NULL,
        CreatedUtc DATETIME2 NOT NULL CONSTRAINT DF_LlmMonthlyTenantBudgetReservations_CreatedUtc DEFAULT (SYSUTCDATETIME()),
        ExpiresUtc DATETIME2 NOT NULL,
        CONSTRAINT PK_LlmMonthlyTenantBudgetReservations PRIMARY KEY (ReservationId),
        CONSTRAINT CK_LlmMonthlyTenantBudgetReservations_Status CHECK (Status IN (0, 1, 2, 3))
    );
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_LlmMonthlyTenantBudgetReservations_Tenant_Period_Pending'
      AND object_id = OBJECT_ID(N'dbo.LlmMonthlyTenantBudgetReservations'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_LlmMonthlyTenantBudgetReservations_Tenant_Period_Pending
        ON dbo.LlmMonthlyTenantBudgetReservations (TenantId, PeriodKey)
        INCLUDE (ReservedUsd, Status, ExpiresUtc)
        WHERE Status = 0;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_LlmMonthlyTenantBudgetReservations_Expires_Pending'
      AND object_id = OBJECT_ID(N'dbo.LlmMonthlyTenantBudgetReservations'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_LlmMonthlyTenantBudgetReservations_Expires_Pending
        ON dbo.LlmMonthlyTenantBudgetReservations (ExpiresUtc)
        INCLUDE (TenantId, PeriodKey, ReservedUsd)
        WHERE Status = 0;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_LlmMonthlyTenantBudget_ExpirePendingReservations
    @ReclaimedCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ReclaimedCount = 0;

    BEGIN TRAN;

    ;WITH ExpiredByTenantPeriod AS
    (
        SELECT TenantId,
               PeriodKey,
               SUM(ReservedUsd) AS ReleaseUsd
        FROM dbo.LlmMonthlyTenantBudgetReservations WITH (UPDLOCK, HOLDLOCK)
        WHERE Status = 0
          AND ExpiresUtc <= SYSUTCDATETIME()
        GROUP BY TenantId, PeriodKey
    )
    UPDATE s
    SET ReservedAssumedUsd = CASE
            WHEN s.ReservedAssumedUsd > e.ReleaseUsd THEN s.ReservedAssumedUsd - e.ReleaseUsd
            ELSE 0
        END,
        LastUpdatedUtc = SYSUTCDATETIME()
    FROM dbo.LlmMonthlyTenantBudgetState s
    INNER JOIN ExpiredByTenantPeriod e
        ON s.TenantId = e.TenantId
       AND s.UtcYear = TRY_CAST(LEFT(e.PeriodKey, 4) AS INT)
       AND s.UtcMonth = TRY_CAST(RIGHT(e.PeriodKey, 2) AS INT);

    UPDATE dbo.LlmMonthlyTenantBudgetReservations
    SET Status = 3
    WHERE Status = 0
      AND ExpiresUtc <= SYSUTCDATETIME();

    SET @ReclaimedCount = @@ROWCOUNT;

    COMMIT TRAN;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_LlmMonthlyTenantBudget_TryReserve
    @ReservationId UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER,
    @PeriodKey NVARCHAR(7),
    @ReserveUsd DECIMAL(18, 6),
    @HardCapUsd DECIMAL(18, 6),
    @RowVersion BINARY(8),
    @ExpiresUtc DATETIME2,
    @Allowed BIT OUTPUT,
    @ReservationIdOut UNIQUEIDENTIFIER OUTPUT,
    @PeriodKeyMismatch BIT OUTPUT,
    @AuthoritativePeriodKey NVARCHAR(7) OUTPUT,
    @HardCapBlocked BIT OUTPUT,
    @ConcurrencyConflict BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @Allowed = 0;
    SET @ReservationIdOut = NULL;
    SET @PeriodKeyMismatch = 0;
    SET @HardCapBlocked = 0;
    SET @ConcurrencyConflict = 0;

    DECLARE @SqlYear INT = DATEPART(YEAR, SYSUTCDATETIME());
    DECLARE @SqlMonth INT = DATEPART(MONTH, SYSUTCDATETIME());
    DECLARE @RequestYear INT = TRY_CAST(LEFT(@PeriodKey, 4) AS INT);
    DECLARE @RequestMonth INT = TRY_CAST(RIGHT(@PeriodKey, 2) AS INT);

    SET @AuthoritativePeriodKey =
        RIGHT('0000' + CAST(@SqlYear AS NVARCHAR(4)), 4) + N'-' + RIGHT('00' + CAST(@SqlMonth AS NVARCHAR(2)), 2);

    IF @RequestYear <> @SqlYear OR @RequestMonth <> @SqlMonth
        SET @PeriodKeyMismatch = 1;

    BEGIN TRAN;

    ;WITH ExpiredByTenantPeriod AS
    (
        SELECT TenantId,
               PeriodKey,
               SUM(ReservedUsd) AS ReleaseUsd
        FROM dbo.LlmMonthlyTenantBudgetReservations WITH (UPDLOCK, HOLDLOCK)
        WHERE Status = 0
          AND ExpiresUtc <= SYSUTCDATETIME()
        GROUP BY TenantId, PeriodKey
    )
    UPDATE s
    SET ReservedAssumedUsd = CASE
            WHEN s.ReservedAssumedUsd > e.ReleaseUsd THEN s.ReservedAssumedUsd - e.ReleaseUsd
            ELSE 0
        END,
        LastUpdatedUtc = SYSUTCDATETIME()
    FROM dbo.LlmMonthlyTenantBudgetState s
    INNER JOIN ExpiredByTenantPeriod e
        ON s.TenantId = e.TenantId
       AND s.UtcYear = TRY_CAST(LEFT(e.PeriodKey, 4) AS INT)
       AND s.UtcMonth = TRY_CAST(RIGHT(e.PeriodKey, 2) AS INT);

    UPDATE dbo.LlmMonthlyTenantBudgetReservations
    SET Status = 3
    WHERE Status = 0
      AND ExpiresUtc <= SYSUTCDATETIME();

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.LlmMonthlyTenantBudgetState WITH (UPDLOCK, HOLDLOCK)
        WHERE TenantId = @TenantId
          AND UtcYear = @SqlYear
          AND UtcMonth = @SqlMonth)
    BEGIN
        INSERT INTO dbo.LlmMonthlyTenantBudgetState
            (TenantId, UtcYear, UtcMonth, SpentUsd, ReservedAssumedUsd, PurchasedCapBumpUsd, WarnedApproaching, LastUpdatedUtc)
        VALUES (@TenantId, @SqlYear, @SqlMonth, 0, 0, 0, 0, SYSUTCDATETIME());
    END

    DECLARE @SpentUsd DECIMAL(18, 6);
    DECLARE @ReservedAssumedUsd DECIMAL(18, 6);
    DECLARE @PurchasedCapBumpUsd DECIMAL(18, 6);
    DECLARE @CurrentRowVersion BINARY(8);

    SELECT @SpentUsd = SpentUsd,
           @ReservedAssumedUsd = ReservedAssumedUsd,
           @PurchasedCapBumpUsd = PurchasedCapBumpUsd,
           @CurrentRowVersion = RowVersion
    FROM dbo.LlmMonthlyTenantBudgetState WITH (UPDLOCK, ROWLOCK)
    WHERE TenantId = @TenantId
      AND UtcYear = @SqlYear
      AND UtcMonth = @SqlMonth;

    IF @CurrentRowVersion <> @RowVersion
    BEGIN
        SET @ConcurrencyConflict = 1;
        ROLLBACK TRAN;
        RETURN;
    END

    DECLARE @EffectiveMax DECIMAL(18, 6) = @HardCapUsd + @PurchasedCapBumpUsd;

    IF (@SpentUsd + @ReservedAssumedUsd + @ReserveUsd) > @EffectiveMax
    BEGIN
        SET @HardCapBlocked = 1;
        ROLLBACK TRAN;
        RETURN;
    END

    UPDATE dbo.LlmMonthlyTenantBudgetState
    SET ReservedAssumedUsd = ReservedAssumedUsd + @ReserveUsd,
        LastUpdatedUtc = SYSUTCDATETIME()
    WHERE TenantId = @TenantId
      AND UtcYear = @SqlYear
      AND UtcMonth = @SqlMonth
      AND RowVersion = @RowVersion
      AND SpentUsd + ReservedAssumedUsd + @ReserveUsd <= @EffectiveMax;

    IF @@ROWCOUNT <> 1
    BEGIN
        SET @ConcurrencyConflict = 1;
        ROLLBACK TRAN;
        RETURN;
    END

    INSERT INTO dbo.LlmMonthlyTenantBudgetReservations
    (
        ReservationId,
        TenantId,
        PeriodKey,
        ReservedUsd,
        Status,
        ExpiresUtc
    )
    VALUES
    (
        @ReservationId,
        @TenantId,
        @AuthoritativePeriodKey,
        @ReserveUsd,
        0,
        @ExpiresUtc
    );

    SET @Allowed = 1;
    SET @ReservationIdOut = @ReservationId;

    COMMIT TRAN;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_LlmMonthlyTenantBudget_Settle
    @ReservationId UNIQUEIDENTIFIER,
    @ActualUsd DECIMAL(18, 6),
    @WarnAtUsd DECIMAL(18, 6),
    @Succeeded BIT OUTPUT,
    @ShouldEmitWarnAudit BIT OUTPUT,
    @PeriodKeyMismatch BIT OUTPUT,
    @AuthoritativePeriodKey NVARCHAR(7) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @Succeeded = 0;
    SET @ShouldEmitWarnAudit = 0;
    SET @PeriodKeyMismatch = 0;

    DECLARE @SqlYear INT = DATEPART(YEAR, SYSUTCDATETIME());
    DECLARE @SqlMonth INT = DATEPART(MONTH, SYSUTCDATETIME());

    SET @AuthoritativePeriodKey =
        RIGHT('0000' + CAST(@SqlYear AS NVARCHAR(4)), 4) + N'-' + RIGHT('00' + CAST(@SqlMonth AS NVARCHAR(2)), 2);

    BEGIN TRAN;

    DECLARE @TenantId UNIQUEIDENTIFIER;
    DECLARE @ReservedUsd DECIMAL(18, 6);
    DECLARE @MintedYear INT;
    DECLARE @MintedMonth INT;

    SELECT @TenantId = TenantId,
           @ReservedUsd = ReservedUsd,
           @MintedYear = TRY_CAST(LEFT(PeriodKey, 4) AS INT),
           @MintedMonth = TRY_CAST(RIGHT(PeriodKey, 2) AS INT)
    FROM dbo.LlmMonthlyTenantBudgetReservations WITH (UPDLOCK, ROWLOCK)
    WHERE ReservationId = @ReservationId
      AND Status = 0;

    IF @TenantId IS NULL
    BEGIN
        ROLLBACK TRAN;
        RETURN;
    END

    IF @MintedYear <> @SqlYear OR @MintedMonth <> @SqlMonth
        SET @PeriodKeyMismatch = 1;

    CREATE TABLE #SettleOutput
    (
        OldSpent DECIMAL(18, 6) NOT NULL,
        OldWarned BIT NOT NULL,
        NewSpent DECIMAL(18, 6) NOT NULL,
        NewWarned BIT NOT NULL
    );

    UPDATE dbo.LlmMonthlyTenantBudgetState
    SET SpentUsd = SpentUsd + @ActualUsd,
        ReservedAssumedUsd = ReservedAssumedUsd - @ReservedUsd,
        WarnedApproaching = CASE
            WHEN WarnedApproaching = 1 THEN 1
            WHEN SpentUsd < @WarnAtUsd AND SpentUsd + @ActualUsd >= @WarnAtUsd THEN 1
            ELSE WarnedApproaching
        END,
        LastUpdatedUtc = SYSUTCDATETIME()
    OUTPUT DELETED.SpentUsd, DELETED.WarnedApproaching, INSERTED.SpentUsd, INSERTED.WarnedApproaching
    INTO #SettleOutput (OldSpent, OldWarned, NewSpent, NewWarned)
    WHERE TenantId = @TenantId
      AND UtcYear = @MintedYear
      AND UtcMonth = @MintedMonth
      AND ReservedAssumedUsd >= @ReservedUsd;

    IF @@ROWCOUNT <> 1
    BEGIN
        DROP TABLE #SettleOutput;
        ROLLBACK TRAN;
        RETURN;
    END

    SELECT @ShouldEmitWarnAudit = CASE
        WHEN OldWarned = 0 AND OldSpent < @WarnAtUsd AND NewSpent >= @WarnAtUsd THEN 1
        ELSE 0
    END
    FROM #SettleOutput;

    DROP TABLE #SettleOutput;

    UPDATE dbo.LlmMonthlyTenantBudgetReservations
    SET Status = 1,
        CommittedUsd = @ActualUsd
    WHERE ReservationId = @ReservationId
      AND Status = 0;

    SET @Succeeded = 1;

    COMMIT TRAN;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_LlmMonthlyTenantBudget_Release
    @ReservationId UNIQUEIDENTIFIER,
    @Succeeded BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @Succeeded = 0;

    BEGIN TRAN;

    DECLARE @TenantId UNIQUEIDENTIFIER;
    DECLARE @ReservedUsd DECIMAL(18, 6);
    DECLARE @MintedYear INT;
    DECLARE @MintedMonth INT;

    SELECT @TenantId = TenantId,
           @ReservedUsd = ReservedUsd,
           @MintedYear = TRY_CAST(LEFT(PeriodKey, 4) AS INT),
           @MintedMonth = TRY_CAST(RIGHT(PeriodKey, 2) AS INT)
    FROM dbo.LlmMonthlyTenantBudgetReservations WITH (UPDLOCK, ROWLOCK)
    WHERE ReservationId = @ReservationId
      AND Status = 0;

    IF @TenantId IS NULL
    BEGIN
        ROLLBACK TRAN;
        RETURN;
    END

    UPDATE dbo.LlmMonthlyTenantBudgetState
    SET ReservedAssumedUsd = ReservedAssumedUsd - @ReservedUsd,
        LastUpdatedUtc = SYSUTCDATETIME()
    WHERE TenantId = @TenantId
      AND UtcYear = @MintedYear
      AND UtcMonth = @MintedMonth
      AND ReservedAssumedUsd >= @ReservedUsd;

    IF @@ROWCOUNT <> 1
    BEGIN
        ROLLBACK TRAN;
        RETURN;
    END

    UPDATE dbo.LlmMonthlyTenantBudgetReservations
    SET Status = 2
    WHERE ReservationId = @ReservationId
      AND Status = 0;

    SET @Succeeded = 1;

    COMMIT TRAN;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_LlmMonthlyTenantBudget_ReconcileUnsettled
    @ReservationId UNIQUEIDENTIFIER,
    @ActualUsd DECIMAL(18, 6),
    @WarnAtUsd DECIMAL(18, 6),
    @Succeeded BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ShouldEmitWarnAudit BIT;
    DECLARE @PeriodKeyMismatch BIT;
    DECLARE @AuthoritativePeriodKey NVARCHAR(7);

    EXEC dbo.usp_LlmMonthlyTenantBudget_Settle
        @ReservationId = @ReservationId,
        @ActualUsd = @ActualUsd,
        @WarnAtUsd = @WarnAtUsd,
        @Succeeded = @Succeeded OUTPUT,
        @ShouldEmitWarnAudit = @ShouldEmitWarnAudit OUTPUT,
        @PeriodKeyMismatch = @PeriodKeyMismatch OUTPUT,
        @AuthoritativePeriodKey = @AuthoritativePeriodKey OUTPUT;
END
GO
