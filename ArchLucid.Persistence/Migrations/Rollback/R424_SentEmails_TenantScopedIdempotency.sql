/*
  Rollback 424: Restore globally unique sent-email idempotency keys.
*/
IF OBJECT_ID(N'dbo.SentEmails', N'U') IS NOT NULL
BEGIN
    IF EXISTS
    (
        SELECT 1
        FROM dbo.SentEmails
        GROUP BY IdempotencyKey
        HAVING COUNT(*) > 1
    )
        THROW 50001, 'Cannot restore the global SentEmails key while duplicate keys exist across tenants.', 1;

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
        ADD CONSTRAINT PK_SentEmails
            PRIMARY KEY (IdempotencyKey);
END;
GO
