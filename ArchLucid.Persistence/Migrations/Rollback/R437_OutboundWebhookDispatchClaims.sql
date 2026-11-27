/* Disable automatic webhook dispatch before rollback. Do not drop active duplicate protection. */
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF OBJECT_ID(N'dbo.OutboundWebhookDispatchClaims', N'U') IS NOT NULL
    BEGIN
        DECLARE @rows BIGINT;
        SELECT @rows = COUNT_BIG(*) FROM dbo.OutboundWebhookDispatchClaims WITH (TABLOCKX, HOLDLOCK);
        IF @rows <> 0
            THROW 51437, 'Outbound webhook dispatch claims exist; rollback would discard replay protection.', 1;
        DROP TABLE dbo.OutboundWebhookDispatchClaims;
    END;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
