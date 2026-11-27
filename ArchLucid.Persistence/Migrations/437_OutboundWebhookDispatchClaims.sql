/* Append-only one-shot reservations. A reservation does not confirm remote delivery. */
IF OBJECT_ID(N'dbo.OutboundWebhookDispatchClaims', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OutboundWebhookDispatchClaims
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        EventId UNIQUEIDENTIFIER NOT NULL,
        DestinationHash BINARY(32) NOT NULL,
        ClaimedUtc DATETIME2(7) NOT NULL CONSTRAINT DF_OutboundWebhookDispatchClaims_ClaimedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_OutboundWebhookDispatchClaims PRIMARY KEY (TenantId, EventId, DestinationHash)
    );
END;
GO
