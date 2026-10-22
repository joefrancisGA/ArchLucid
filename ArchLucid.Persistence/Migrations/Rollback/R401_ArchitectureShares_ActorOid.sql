/*
  R401: Restore ArchitectureShares.UserId after 401_ArchitectureShares_ActorOid.sql.

  Only platform-user:{guid} actor keys map back to the migration 380 UserId column.
  The script stops before dropping ActorOid when any row cannot be mapped.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'ActorOid') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'UserId') IS NULL
BEGIN
    ALTER TABLE dbo.ArchitectureShares
        ADD UserId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'ActorOid') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'UserId') IS NOT NULL
BEGIN
    EXEC sys.sp_executesql N'
        UPDATE dbo.ArchitectureShares
        SET UserId = TRY_CONVERT(UNIQUEIDENTIFIER, SUBSTRING(ActorOid, 15, 36))
        WHERE UserId IS NULL
          AND ActorOid LIKE N''platform-user:%''
          AND LEN(ActorOid) = 50
          AND TRY_CONVERT(UNIQUEIDENTIFIER, SUBSTRING(ActorOid, 15, 36)) IS NOT NULL;';
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'ActorOid') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'UserId') IS NOT NULL
BEGIN
    EXEC sys.sp_executesql N'
        IF EXISTS (SELECT 1 FROM dbo.ArchitectureShares WHERE UserId IS NULL)
            THROW 50401, N''R401 rollback cannot map every ArchitectureShares.ActorOid back to a platform-user UserId.'', 1;';
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'UserId') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'ActorOid') IS NOT NULL
BEGIN
    EXEC sys.sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.ArchitectureShares WHERE UserId IS NULL)
            ALTER TABLE dbo.ArchitectureShares ALTER COLUMN UserId UNIQUEIDENTIFIER NOT NULL;';
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'ActorOid') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_ArchitectureShares_ActorOid'
         AND object_id = OBJECT_ID(N'dbo.ArchitectureShares'))
BEGIN
    EXEC sys.sp_executesql N'
        IF COL_LENGTH(N''dbo.ArchitectureShares'', N''UserId'') IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM dbo.ArchitectureShares WHERE UserId IS NULL)
            DROP INDEX IX_ArchitectureShares_ActorOid ON dbo.ArchitectureShares;';
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.key_constraints
       WHERE name = N'PK_ArchitectureShares'
         AND parent_object_id = OBJECT_ID(N'dbo.ArchitectureShares'))
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'ActorOid') IS NOT NULL
BEGIN
    EXEC sys.sp_executesql N'
        IF COL_LENGTH(N''dbo.ArchitectureShares'', N''UserId'') IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM dbo.ArchitectureShares WHERE UserId IS NULL)
            ALTER TABLE dbo.ArchitectureShares DROP CONSTRAINT PK_ArchitectureShares;';
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'ActorOid') IS NOT NULL
BEGIN
    EXEC sys.sp_executesql N'
        IF COL_LENGTH(N''dbo.ArchitectureShares'', N''UserId'') IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM dbo.ArchitectureShares WHERE UserId IS NULL)
           AND NOT EXISTS (
               SELECT 1
               FROM sys.key_constraints
               WHERE name = N''PK_ArchitectureShares''
                 AND parent_object_id = OBJECT_ID(N''dbo.ArchitectureShares''))
            ALTER TABLE dbo.ArchitectureShares DROP COLUMN ActorOid;';
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'UserId') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.key_constraints
       WHERE name = N'PK_ArchitectureShares'
         AND parent_object_id = OBJECT_ID(N'dbo.ArchitectureShares'))
BEGIN
    EXEC sys.sp_executesql N'
        ALTER TABLE dbo.ArchitectureShares
            ADD CONSTRAINT PK_ArchitectureShares PRIMARY KEY CLUSTERED (ArchitectureId, UserId);';
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'UserId') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_ArchitectureShares_PlatformUsers'
         AND parent_object_id = OBJECT_ID(N'dbo.ArchitectureShares'))
BEGIN
    EXEC sys.sp_executesql N'
        ALTER TABLE dbo.ArchitectureShares
            ADD CONSTRAINT FK_ArchitectureShares_PlatformUsers
                FOREIGN KEY (UserId) REFERENCES dbo.PlatformUsers (Id);';
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'UserId') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_ArchitectureShares_Tenant_User_Architecture'
         AND object_id = OBJECT_ID(N'dbo.ArchitectureShares'))
BEGIN
    EXEC sys.sp_executesql N'
        CREATE NONCLUSTERED INDEX IX_ArchitectureShares_Tenant_User_Architecture
            ON dbo.ArchitectureShares (TenantId, UserId, ArchitectureId);';
END;
GO
