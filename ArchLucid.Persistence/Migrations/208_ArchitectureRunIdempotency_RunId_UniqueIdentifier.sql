/*
  Improvement #27 — dbo.ArchitectureRunIdempotency.RunId NVARCHAR(64) -> UNIQUEIDENTIFIER + FK dbo.Runs.
*/

SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.ArchitectureRunIdempotency', N'U') IS NULL
BEGIN
    PRINT N'#27 ArchitectureRunIdempotency: table missing; skipping.';
END;
ELSE IF COL_LENGTH(N'dbo.ArchitectureRunIdempotency', N'RunId') IS NULL
    AND COL_LENGTH(N'dbo.ArchitectureRunIdempotency', N'RunIdGuid') IS NOT NULL
    EXEC sp_rename N'dbo.ArchitectureRunIdempotency.RunIdGuid', N'RunId', N'COLUMN';
ELSE IF EXISTS (
    SELECT 1
    FROM sys.columns c
    INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    WHERE c.object_id = OBJECT_ID(N'dbo.ArchitectureRunIdempotency')
      AND c.name = N'RunId'
      AND ty.name IN (N'nvarchar', N'varchar'))
BEGIN
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ArchitectureRunIdempotency_Run')
        ALTER TABLE dbo.ArchitectureRunIdempotency DROP CONSTRAINT FK_ArchitectureRunIdempotency_Run;

    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ArchitectureRunIdempotency_Runs_RunId')
        ALTER TABLE dbo.ArchitectureRunIdempotency DROP CONSTRAINT FK_ArchitectureRunIdempotency_Runs_RunId;

    IF COL_LENGTH(N'dbo.ArchitectureRunIdempotency', N'RunIdGuid') IS NULL
        ALTER TABLE dbo.ArchitectureRunIdempotency ADD RunIdGuid UNIQUEIDENTIFIER NULL;

    UPDATE dbo.ArchitectureRunIdempotency
    SET RunIdGuid = TRY_CAST(RunId AS UNIQUEIDENTIFIER)
    WHERE RunIdGuid IS NULL;

    DELETE t
    FROM dbo.ArchitectureRunIdempotency AS t
    WHERE t.RunIdGuid IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = t.RunIdGuid);

    IF EXISTS (SELECT 1 FROM dbo.ArchitectureRunIdempotency WHERE RunIdGuid IS NULL AND RunId IS NOT NULL)
        THROW 50027, N'#27 ArchitectureRunIdempotency: backfill incomplete — orphaned RunId strings found.', 1;

    ALTER TABLE dbo.ArchitectureRunIdempotency ALTER COLUMN RunIdGuid UNIQUEIDENTIFIER NOT NULL;

    ALTER TABLE dbo.ArchitectureRunIdempotency DROP COLUMN RunId;

    EXEC sp_rename N'dbo.ArchitectureRunIdempotency.RunIdGuid', N'RunId', N'COLUMN';
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureRunIdempotency', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureRunIdempotency', N'RunId') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.ArchitectureRunIdempotency')
         AND c.name = N'RunId'
         AND ty.name = N'uniqueidentifier')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ArchitectureRunIdempotency_Runs_RunId')
        ALTER TABLE dbo.ArchitectureRunIdempotency WITH NOCHECK
            ADD CONSTRAINT FK_ArchitectureRunIdempotency_Runs_RunId FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO
