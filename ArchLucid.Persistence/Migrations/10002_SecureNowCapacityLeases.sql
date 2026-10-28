/*
 SecureNow CAP-03: durable capacity lease primitive.
 Leases are independent of external collection idempotency claims.
 Expired leases are never proof that an external Automation start may be retried.
*/
SET NOCOUNT ON;
GO
IF OBJECT_ID(N'dbo.SecureNowCapacityLeases', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecureNowCapacityLeases
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkloadKey NVARCHAR(64) NOT NULL,
        SlotNumber INT NOT NULL,
        OwnerId UNIQUEIDENTIFIER NULL,
        FencingToken BIGINT NOT NULL CONSTRAINT DF_SecureNowCapacityLeases_Fence DEFAULT (0),
        ExpiresUtc DATETIME2 NOT NULL CONSTRAINT DF_SecureNowCapacityLeases_Expiry DEFAULT ('19000101'),
        CONSTRAINT PK_SecureNowCapacityLeases PRIMARY KEY CLUSTERED (TenantId, WorkloadKey, SlotNumber),
        CONSTRAINT CK_SecureNowCapacityLeases_Slot CHECK (SlotNumber >= 0),
        CONSTRAINT CK_SecureNowCapacityLeases_Fence CHECK (FencingToken >= 0)
    );
END;
GO
