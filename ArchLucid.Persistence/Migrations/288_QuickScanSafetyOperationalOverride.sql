-- TB-898: Runtime Quick Scan safety operational override (kill switch).

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'QuickScanSafetyOperationalOverride' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.QuickScanSafetyOperationalOverride
    (
        OverrideKey CHAR(1) NOT NULL CONSTRAINT DF_QuickScanSafetyOperationalOverride_Key DEFAULT ('G'),
        Mode TINYINT NOT NULL CONSTRAINT DF_QuickScanSafetyOperationalOverride_Mode DEFAULT (0),
        PublicMessage NVARCHAR(500) NOT NULL,
        Reason NVARCHAR(500) NOT NULL,
        ActorUserId NVARCHAR(256) NOT NULL,
        UpdatedUtc DATETIME2 NOT NULL CONSTRAINT DF_QuickScanSafetyOperationalOverride_UpdatedUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_QuickScanSafetyOperationalOverride PRIMARY KEY (OverrideKey),
        CONSTRAINT CK_QuickScanSafetyOperationalOverride_Mode CHECK (Mode IN (0, 1, 2, 3))
    );

    INSERT INTO dbo.QuickScanSafetyOperationalOverride (OverrideKey, Mode, PublicMessage, Reason, ActorUserId)
    VALUES ('G', 0, '', 'Initial seed', 'system');
END

GO

CREATE OR ALTER PROCEDURE dbo.usp_QuickScanSafetyOperational_Get
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Mode, PublicMessage, Reason, ActorUserId, UpdatedUtc
    FROM dbo.QuickScanSafetyOperationalOverride WITH (NOLOCK)
    WHERE OverrideKey = 'G';
END

GO

CREATE OR ALTER PROCEDURE dbo.usp_QuickScanSafetyOperational_Set
    @Mode TINYINT,
    @PublicMessage NVARCHAR(500),
    @Reason NVARCHAR(500),
    @ActorUserId NVARCHAR(256),
    @UpdatedUtc DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    UPDATE dbo.QuickScanSafetyOperationalOverride
    SET Mode = @Mode,
        PublicMessage = @PublicMessage,
        Reason = @Reason,
        ActorUserId = @ActorUserId,
        UpdatedUtc = @UpdatedUtc
    WHERE OverrideKey = 'G';

    IF @@ROWCOUNT = 0
    BEGIN
        INSERT INTO dbo.QuickScanSafetyOperationalOverride
            (OverrideKey, Mode, PublicMessage, Reason, ActorUserId, UpdatedUtc)
        VALUES
            ('G', @Mode, @PublicMessage, @Reason, @ActorUserId, @UpdatedUtc);
    END

    COMMIT TRANSACTION;
END

GO
