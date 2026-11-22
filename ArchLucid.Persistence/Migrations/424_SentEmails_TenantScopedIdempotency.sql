/*
  424: Scope sent-email idempotency to each tenant.
*/
IF OBJECT_ID(N'dbo.SentEmails', N'U') IS NOT NULL
BEGIN
    DECLARE @PrimaryKeyName SYSNAME;

    SELECT @PrimaryKeyName = kc.name
    FROM sys.key_constraints kc
    WHERE kc.parent_object_id = OBJECT_ID(N'dbo.SentEmails')
      AND kc.[type] = N'PK';

    IF @PrimaryKeyName IS NOT NULL
    BEGIN
        DECLARE @DropPrimaryKeySql NVARCHAR(MAX) =
            N'ALTER TABLE dbo.SentEmails DROP CONSTRAINT ' + QUOTENAME(@PrimaryKeyName) + N';';
        EXEC sys.sp_executesql @DropPrimaryKeySql;
    END;

    ALTER TABLE dbo.SentEmails
        ADD CONSTRAINT PK_SentEmails_TenantId_IdempotencyKey
            PRIMARY KEY NONCLUSTERED (TenantId, IdempotencyKey);
END;
GO
