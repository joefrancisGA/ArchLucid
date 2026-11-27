/* Disable Azure DevOps decoration before rollback. Do not drop active duplicate protection. */
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF OBJECT_ID(N'dbo.AzureDevOpsThreadCreateClaims', N'U') IS NOT NULL
    BEGIN
        DECLARE @rows BIGINT;
        SELECT @rows = COUNT_BIG(*) FROM dbo.AzureDevOpsThreadCreateClaims WITH (TABLOCKX, HOLDLOCK);
        IF @rows <> 0
            THROW 51436, 'Azure DevOps thread claims exist; rollback would discard replay protection.', 1;
        DROP TABLE dbo.AzureDevOpsThreadCreateClaims;
    END;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
