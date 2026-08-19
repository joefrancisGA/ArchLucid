/*
  Roll back DbUp 209 — dbo.CommitRunIdempotency.RunId UNIQUEIDENTIFIER -> NVARCHAR(64) + drop FK dbo.Runs.

  Restore stores CONVERT(NVARCHAR(36), guid); extended data loss when values were not RFC GUID strings on legacy rows.
*/

SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'FK_CommitRunIdempotency_Runs_RunId'
      AND parent_object_id = OBJECT_ID(N'dbo.CommitRunIdempotency'))
    ALTER TABLE dbo.CommitRunIdempotency DROP CONSTRAINT FK_CommitRunIdempotency_Runs_RunId;
GO

IF COL_LENGTH(N'dbo.CommitRunIdempotency', N'RunId') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.CommitRunIdempotency')
         AND c.name = N'RunId'
         AND ty.name = N'uniqueidentifier')
BEGIN
    IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'PK_CommitRunIdempotency')
        ALTER TABLE dbo.CommitRunIdempotency DROP CONSTRAINT PK_CommitRunIdempotency;

    ALTER TABLE dbo.CommitRunIdempotency ADD RunIdRevert NVARCHAR(64) NULL;

    UPDATE dbo.CommitRunIdempotency
    SET RunIdRevert = CONVERT(NVARCHAR(36), RunId)
    WHERE RunId IS NOT NULL;

    ALTER TABLE dbo.CommitRunIdempotency ALTER COLUMN RunIdRevert NVARCHAR(64) NOT NULL;

    ALTER TABLE dbo.CommitRunIdempotency DROP COLUMN RunId;

    EXEC sp_rename N'dbo.CommitRunIdempotency.RunIdRevert', N'RunId', N'COLUMN';

    IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'PK_CommitRunIdempotency')
        ALTER TABLE dbo.CommitRunIdempotency
            ADD CONSTRAINT PK_CommitRunIdempotency
            PRIMARY KEY (TenantId, WorkspaceId, ProjectId, RunId, IdempotencyKeyHash);

    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_CommitRunIdempotency_RunIdLen')
        ALTER TABLE dbo.CommitRunIdempotency
            ADD CONSTRAINT CK_CommitRunIdempotency_RunIdLen CHECK (LEN(RunId) > 0);
END;
GO
