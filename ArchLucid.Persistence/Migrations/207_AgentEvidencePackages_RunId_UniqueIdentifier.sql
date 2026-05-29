/*
  Improvement #27 — dbo.AgentEvidencePackages.RunId NVARCHAR(64) -> UNIQUEIDENTIFIER + FK dbo.Runs.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AgentEvidencePackages', N'U') IS NULL
BEGIN
    PRINT N'#27 AgentEvidencePackages: table missing; skipping.';
END;
GO

IF OBJECT_ID(N'dbo.AgentEvidencePackages', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentEvidencePackages', N'RunId') IS NULL
   AND COL_LENGTH(N'dbo.AgentEvidencePackages', N'RunIdGuid') IS NOT NULL
BEGIN
    EXEC sp_rename N'dbo.AgentEvidencePackages.RunIdGuid', N'RunId', N'COLUMN';
END;
GO

IF OBJECT_ID(N'dbo.AgentEvidencePackages', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.AgentEvidencePackages')
         AND c.name = N'RunId'
         AND ty.name IN (N'nvarchar', N'varchar'))
BEGIN
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentEvidencePackages_Run')
        ALTER TABLE dbo.AgentEvidencePackages DROP CONSTRAINT FK_AgentEvidencePackages_Run;

    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentEvidencePackages_Runs_RunId')
        ALTER TABLE dbo.AgentEvidencePackages DROP CONSTRAINT FK_AgentEvidencePackages_Runs_RunId;

    IF COL_LENGTH(N'dbo.AgentEvidencePackages', N'RunIdGuid') IS NULL
        ALTER TABLE dbo.AgentEvidencePackages ADD RunIdGuid UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.AgentEvidencePackages', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentEvidencePackages', N'RunIdGuid') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.AgentEvidencePackages')
         AND c.name = N'RunId'
         AND ty.name IN (N'nvarchar', N'varchar'))
BEGIN
    UPDATE dbo.AgentEvidencePackages
    SET RunIdGuid = TRY_CAST(RunId AS UNIQUEIDENTIFIER)
    WHERE RunIdGuid IS NULL;

    DELETE t
    FROM dbo.AgentEvidencePackages AS t
    WHERE t.RunIdGuid IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = t.RunIdGuid);

    IF EXISTS (SELECT 1 FROM dbo.AgentEvidencePackages WHERE RunIdGuid IS NULL AND RunId IS NOT NULL)
        THROW 50027, N'#27 AgentEvidencePackages: backfill incomplete — orphaned RunId strings found.', 1;

    ALTER TABLE dbo.AgentEvidencePackages ALTER COLUMN RunIdGuid UNIQUEIDENTIFIER NOT NULL;

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.AgentEvidencePackages') AND name = N'IX_AgentEvidencePackages_RunId')
        DROP INDEX IX_AgentEvidencePackages_RunId ON dbo.AgentEvidencePackages;

    ALTER TABLE dbo.AgentEvidencePackages DROP COLUMN RunId;

    EXEC sp_rename N'dbo.AgentEvidencePackages.RunIdGuid', N'RunId', N'COLUMN';
END;
GO

IF OBJECT_ID(N'dbo.AgentEvidencePackages', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentEvidencePackages', N'RunId') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.AgentEvidencePackages')
         AND c.name = N'RunId'
         AND ty.name = N'uniqueidentifier')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.AgentEvidencePackages') AND name = N'IX_AgentEvidencePackages_RunId')
        CREATE NONCLUSTERED INDEX IX_AgentEvidencePackages_RunId ON dbo.AgentEvidencePackages (RunId);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentEvidencePackages_Runs_RunId')
        ALTER TABLE dbo.AgentEvidencePackages WITH NOCHECK
            ADD CONSTRAINT FK_AgentEvidencePackages_Runs_RunId FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO
