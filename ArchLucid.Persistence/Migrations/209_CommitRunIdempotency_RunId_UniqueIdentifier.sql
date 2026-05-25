/*
  Improvement #27 — dbo.CommitRunIdempotency.RunId NVARCHAR(64) -> UNIQUEIDENTIFIER (composite PK) + FK dbo.Runs.
*/

SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NULL
BEGIN
    PRINT N'#27 CommitRunIdempotency: table missing; skipping.';
END;
ELSE IF COL_LENGTH(N'dbo.CommitRunIdempotency', N'RunId') IS NULL
    AND COL_LENGTH(N'dbo.CommitRunIdempotency', N'RunIdGuid') IS NOT NULL
    EXEC sp_rename N'dbo.CommitRunIdempotency.RunIdGuid', N'RunId', N'COLUMN';
ELSE IF EXISTS (
    SELECT 1
    FROM sys.columns c
    INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    WHERE c.object_id = OBJECT_ID(N'dbo.CommitRunIdempotency')
      AND c.name = N'RunId'
      AND ty.name IN (N'nvarchar', N'varchar'))
BEGIN
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CommitRunIdempotency_Runs_RunId')
        ALTER TABLE dbo.CommitRunIdempotency DROP CONSTRAINT FK_CommitRunIdempotency_Runs_RunId;

    IF COL_LENGTH(N'dbo.CommitRunIdempotency', N'RunIdGuid') IS NULL
        ALTER TABLE dbo.CommitRunIdempotency ADD RunIdGuid UNIQUEIDENTIFIER NULL;

    UPDATE dbo.CommitRunIdempotency
    SET RunIdGuid = TRY_CAST(RunId AS UNIQUEIDENTIFIER)
    WHERE RunIdGuid IS NULL;

    DELETE t
    FROM dbo.CommitRunIdempotency AS t
    WHERE t.RunIdGuid IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = t.RunIdGuid);

    IF EXISTS (SELECT 1 FROM dbo.CommitRunIdempotency WHERE RunIdGuid IS NULL AND RunId IS NOT NULL)
        THROW 50027, N'#27 CommitRunIdempotency: backfill incomplete — orphaned RunId strings found.', 1;

    ALTER TABLE dbo.CommitRunIdempotency ALTER COLUMN RunIdGuid UNIQUEIDENTIFIER NOT NULL;

    IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'PK_CommitRunIdempotency')
        ALTER TABLE dbo.CommitRunIdempotency DROP CONSTRAINT PK_CommitRunIdempotency;

    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_CommitRunIdempotency_RunIdLen')
        ALTER TABLE dbo.CommitRunIdempotency DROP CONSTRAINT CK_CommitRunIdempotency_RunIdLen;

    ALTER TABLE dbo.CommitRunIdempotency DROP COLUMN RunId;

    EXEC sp_rename N'dbo.CommitRunIdempotency.RunIdGuid', N'RunId', N'COLUMN';

    IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'PK_CommitRunIdempotency')
        ALTER TABLE dbo.CommitRunIdempotency
            ADD CONSTRAINT PK_CommitRunIdempotency
            PRIMARY KEY (TenantId, WorkspaceId, ProjectId, RunId, IdempotencyKeyHash);
END;
GO

IF OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.CommitRunIdempotency', N'RunId') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.CommitRunIdempotency')
         AND c.name = N'RunId'
         AND ty.name = N'uniqueidentifier')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CommitRunIdempotency_Runs_RunId')
        ALTER TABLE dbo.CommitRunIdempotency WITH NOCHECK
            ADD CONSTRAINT FK_CommitRunIdempotency_Runs_RunId FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO
