/* Manual rollback: preserve replay baselines; never silently discard security state.
   Disable telemetry on every replica and quiesce writers before running.
   Back up the catalog; rollback is refused if any watermark exists. */
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF OBJECT_ID(N'dbo.RuntimeAttestationWatermarks', N'U') IS NOT NULL
    BEGIN
        DECLARE @rows BIGINT;
        SELECT @rows = COUNT_BIG(*) FROM dbo.RuntimeAttestationWatermarks WITH (TABLOCKX, HOLDLOCK);
        IF @rows <> 0
            THROW 51434, 'Runtime attestation watermarks exist; rollback would discard replay protection.', 1;
    END;
    DROP PROCEDURE IF EXISTS dbo.TryAdvanceRuntimeAttestationWatermark;
    DROP TABLE IF EXISTS dbo.RuntimeAttestationWatermarks;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
