/* Disable journal writers and back up the tenant catalog before manual rollback.
   Refuse to destroy persisted finding evidence. */
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF OBJECT_ID(N'dbo.RuntimeFindingEvidenceJournal', N'U') IS NOT NULL
    BEGIN
        DECLARE @rows BIGINT;
        SELECT @rows = COUNT_BIG(*) FROM dbo.RuntimeFindingEvidenceJournal WITH (TABLOCKX, HOLDLOCK);
        IF @rows <> 0
            THROW 51435, 'Runtime finding evidence exists; rollback would discard evidence.', 1;
    END;
    DROP PROCEDURE IF EXISTS dbo.AppendRuntimeFindingEvidence;
    DROP TABLE IF EXISTS dbo.RuntimeFindingEvidenceJournal;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
