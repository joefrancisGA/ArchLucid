-- TB-939: run-scoped LLM budget reservations (admit-before-spend for agent batches).

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RunScopedLlmBudgetReservations' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.RunScopedLlmBudgetReservations
    (
        ReservationId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        RunId NVARCHAR(64) NOT NULL,
        IdempotencyKeyHash VARBINARY(32) NOT NULL,
        PeriodKey NVARCHAR(7) NOT NULL,
        ReservedUsd DECIMAL(18, 6) NOT NULL,
        CommittedUsd DECIMAL(18, 6) NULL,
        Status TINYINT NOT NULL,
        CreatedUtc DATETIME2 NOT NULL CONSTRAINT DF_RunScopedLlmBudgetReservations_CreatedUtc DEFAULT (SYSUTCDATETIME()),
        ExpiresUtc DATETIME2 NOT NULL,
        CONSTRAINT PK_RunScopedLlmBudgetReservations PRIMARY KEY (ReservationId),
        CONSTRAINT CK_RunScopedLlmBudgetReservations_Status CHECK (Status IN (0, 1, 2, 3))
    );
END
GO

-- Only one *pending* reservation per idempotency key — committed/released keys must allow re-execute.
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UQ_RunScopedLlmBudgetReservations_Idempotency_Pending'
      AND object_id = OBJECT_ID(N'dbo.RunScopedLlmBudgetReservations'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_RunScopedLlmBudgetReservations_Idempotency_Pending
        ON dbo.RunScopedLlmBudgetReservations (IdempotencyKeyHash)
        WHERE Status = 0;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_RunScopedLlmBudgetReservations_Tenant_Period_Pending'
      AND object_id = OBJECT_ID(N'dbo.RunScopedLlmBudgetReservations'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_RunScopedLlmBudgetReservations_Tenant_Period_Pending
        ON dbo.RunScopedLlmBudgetReservations (TenantId, PeriodKey)
        INCLUDE (ReservedUsd, Status, ExpiresUtc)
        WHERE Status = 0;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_RunScopedLlmBudget_TryReserve
    @ReservationId UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER,
    @RunId NVARCHAR(64),
    @IdempotencyKeyHash VARBINARY(32),
    @PeriodKey NVARCHAR(7),
    @ReserveUsd DECIMAL(18, 6),
    @CurrentPressureUsd DECIMAL(18, 6),
    @HardCapUsd DECIMAL(18, 6),
    @ExpiresUtc DATETIME2,
    @Allowed BIT OUTPUT,
    @ReservationIdOut UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @Allowed = 0;
    SET @ReservationIdOut = NULL;

    BEGIN TRAN;

    UPDATE dbo.RunScopedLlmBudgetReservations
    SET Status = 3
    WHERE Status = 0
      AND ExpiresUtc <= SYSUTCDATETIME();

    DECLARE @ExistingId UNIQUEIDENTIFIER;

    SELECT TOP (1) @ExistingId = ReservationId
    FROM dbo.RunScopedLlmBudgetReservations WITH (UPDLOCK, HOLDLOCK)
    WHERE IdempotencyKeyHash = @IdempotencyKeyHash
      AND Status = 0
      AND ExpiresUtc > SYSUTCDATETIME();

    IF @ExistingId IS NOT NULL
    BEGIN
        SET @Allowed = 1;
        SET @ReservationIdOut = @ExistingId;
        COMMIT TRAN;
        RETURN;
    END;

    IF @ReserveUsd <= 0
    BEGIN
        INSERT INTO dbo.RunScopedLlmBudgetReservations
        (
            ReservationId,
            TenantId,
            RunId,
            IdempotencyKeyHash,
            PeriodKey,
            ReservedUsd,
            Status,
            ExpiresUtc
        )
        VALUES
        (
            @ReservationId,
            @TenantId,
            @RunId,
            @IdempotencyKeyHash,
            @PeriodKey,
            0,
            0,
            @ExpiresUtc
        );

        SET @Allowed = 1;
        SET @ReservationIdOut = @ReservationId;
        COMMIT TRAN;
        RETURN;
    END;

    DECLARE @PendingUsd DECIMAL(18, 6) =
    (
        SELECT ISNULL(SUM(ReservedUsd), 0)
        FROM dbo.RunScopedLlmBudgetReservations WITH (UPDLOCK, HOLDLOCK)
        WHERE TenantId = @TenantId
          AND PeriodKey = @PeriodKey
          AND Status = 0
          AND ExpiresUtc > SYSUTCDATETIME()
    );

    IF (@CurrentPressureUsd + @PendingUsd + @ReserveUsd) > @HardCapUsd
    BEGIN
        ROLLBACK TRAN;
        RETURN;
    END;

    INSERT INTO dbo.RunScopedLlmBudgetReservations
    (
        ReservationId,
        TenantId,
        RunId,
        IdempotencyKeyHash,
        PeriodKey,
        ReservedUsd,
        Status,
        ExpiresUtc
    )
    VALUES
    (
        @ReservationId,
        @TenantId,
        @RunId,
        @IdempotencyKeyHash,
        @PeriodKey,
        @ReserveUsd,
        0,
        @ExpiresUtc
    );

    SET @Allowed = 1;
    SET @ReservationIdOut = @ReservationId;
    COMMIT TRAN;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_RunScopedLlmBudget_Commit
    @ReservationId UNIQUEIDENTIFIER,
    @ActualUsd DECIMAL(18, 6)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.RunScopedLlmBudgetReservations
    SET Status = 1,
        CommittedUsd = @ActualUsd
    WHERE ReservationId = @ReservationId
      AND Status = 0;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_RunScopedLlmBudget_Release
    @ReservationId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.RunScopedLlmBudgetReservations
    SET Status = 2
    WHERE ReservationId = @ReservationId
      AND Status = 0;
END
GO
