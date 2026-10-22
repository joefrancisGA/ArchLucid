/*
  401: Align ArchitectureShares with the actor-key repository contract.
  Migration 380 originally created UserId, but share reads and writes use ActorOid
  so JWT, platform-user, and group actors can share one schema.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'ActorOid') IS NULL
BEGIN
    ALTER TABLE dbo.ArchitectureShares
        ADD ActorOid NVARCHAR(256) NULL;
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'ActorOid') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'UserId') IS NOT NULL
BEGIN
    /*
      SQL Server binds column names when it compiles the batch, even when the
      statement is behind an IF that checks COL_LENGTH. Execute the legacy
      UserId reference dynamically so this migration also runs on databases
      created from the ActorOid schema.
    */
    EXEC sys.sp_executesql N'
        UPDATE dbo.ArchitectureShares
        SET ActorOid = CONCAT(N''platform-user:'', CONVERT(NVARCHAR(36), UserId))
        WHERE ActorOid IS NULL;';
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'ActorOid') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'UserId') IS NOT NULL
BEGIN
    DROP INDEX IF EXISTS IX_ArchitectureShares_Tenant_User_Architecture
        ON dbo.ArchitectureShares;
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_ArchitectureShares_PlatformUsers'
         AND parent_object_id = OBJECT_ID(N'dbo.ArchitectureShares'))
BEGIN
    ALTER TABLE dbo.ArchitectureShares
        DROP CONSTRAINT FK_ArchitectureShares_PlatformUsers;
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.key_constraints
       WHERE name = N'PK_ArchitectureShares'
         AND parent_object_id = OBJECT_ID(N'dbo.ArchitectureShares'))
BEGIN
    ALTER TABLE dbo.ArchitectureShares
        DROP CONSTRAINT PK_ArchitectureShares;
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'ActorOid') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ArchitectureShares
        ALTER COLUMN ActorOid NVARCHAR(256) NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureShares', N'UserId') IS NOT NULL
BEGIN
    EXEC sys.sp_executesql N'
        ALTER TABLE dbo.ArchitectureShares
            DROP COLUMN UserId;';
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.key_constraints
       WHERE name = N'PK_ArchitectureShares'
         AND parent_object_id = OBJECT_ID(N'dbo.ArchitectureShares'))
BEGIN
    ALTER TABLE dbo.ArchitectureShares
        ADD CONSTRAINT PK_ArchitectureShares PRIMARY KEY CLUSTERED (ArchitectureId, ActorOid);
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_ArchitectureShares_ActorOid'
         AND object_id = OBJECT_ID(N'dbo.ArchitectureShares'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ArchitectureShares_ActorOid
        ON dbo.ArchitectureShares (ActorOid);
END;
GO
