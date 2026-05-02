/*
  TB-006: dbo.ComparisonRecords — LeftRunId / RightRunId NVARCHAR -> UNIQUEIDENTIFIER + FK dbo.Runs (NO ACTION).

  Idempotent: safe to re-run. Logs (PRINT) counts where TRY_CONVERT fails. Deletes rows that would violate FK
  after successful GUID parse (no matching dbo.Runs row) before adding constraints.
*/

SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.ComparisonRecords', N'U') IS NULL
BEGIN
    PRINT N'TB-006: dbo.ComparisonRecords missing; skipping.';
END;
ELSE
BEGIN
    IF COL_LENGTH(N'dbo.ComparisonRecords', N'LeftRunId') IS NULL
       AND COL_LENGTH(N'dbo.ComparisonRecords', N'LeftRunIdGuid') IS NOT NULL
        EXEC sp_rename N'dbo.ComparisonRecords.LeftRunIdGuid', N'LeftRunId', N'COLUMN';

    IF COL_LENGTH(N'dbo.ComparisonRecords', N'RightRunId') IS NULL
       AND COL_LENGTH(N'dbo.ComparisonRecords', N'RightRunIdGuid') IS NOT NULL
        EXEC sp_rename N'dbo.ComparisonRecords.RightRunIdGuid', N'RightRunId', N'COLUMN';

    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
        WHERE c.object_id = OBJECT_ID(N'dbo.ComparisonRecords')
          AND c.name = N'LeftRunId'
          AND ty.name IN (N'nvarchar', N'varchar'))
    BEGIN
        IF COL_LENGTH(N'dbo.ComparisonRecords', N'LeftRunIdGuid') IS NULL
            ALTER TABLE dbo.ComparisonRecords ADD LeftRunIdGuid UNIQUEIDENTIFIER NULL;

        IF COL_LENGTH(N'dbo.ComparisonRecords', N'RightRunIdGuid') IS NULL
            ALTER TABLE dbo.ComparisonRecords ADD RightRunIdGuid UNIQUEIDENTIFIER NULL;

        DECLARE @badLeft BIGINT =
        (
            SELECT COUNT_BIG(1)
            FROM dbo.ComparisonRecords
            WHERE LeftRunId IS NOT NULL
              AND TRY_CONVERT(UNIQUEIDENTIFIER, LeftRunId) IS NULL
        );

        DECLARE @badRight BIGINT =
        (
            SELECT COUNT_BIG(1)
            FROM dbo.ComparisonRecords
            WHERE RightRunId IS NOT NULL
              AND TRY_CONVERT(UNIQUEIDENTIFIER, RightRunId) IS NULL
        );

        PRINT N'TB-006: ComparisonRecords LeftRunId not convertible to UNIQUEIDENTIFIER (count) = '
              + CAST(@badLeft AS NVARCHAR(30));
        PRINT N'TB-006: ComparisonRecords RightRunId not convertible to UNIQUEIDENTIFIER (count) = '
              + CAST(@badRight AS NVARCHAR(30));

        EXEC sys.sp_executesql N'
            UPDATE dbo.ComparisonRecords
            SET LeftRunIdGuid = TRY_CONVERT(UNIQUEIDENTIFIER, LeftRunId)
            WHERE LeftRunId IS NOT NULL;

            UPDATE dbo.ComparisonRecords
            SET RightRunIdGuid = TRY_CONVERT(UNIQUEIDENTIFIER, RightRunId)
            WHERE RightRunId IS NOT NULL;

            DELETE c
            FROM dbo.ComparisonRecords AS c
            WHERE c.LeftRunIdGuid IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM dbo.Runs r WHERE r.RunId = c.LeftRunIdGuid);

            DELETE c
            FROM dbo.ComparisonRecords AS c
            WHERE c.RightRunIdGuid IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM dbo.Runs r WHERE r.RunId = c.RightRunIdGuid);';

        IF EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.ComparisonRecords')
              AND name = N'IX_ComparisonRecords_LeftRunId')
            DROP INDEX IX_ComparisonRecords_LeftRunId ON dbo.ComparisonRecords;

        IF EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.ComparisonRecords')
              AND name = N'IX_ComparisonRecords_RightRunId')
            DROP INDEX IX_ComparisonRecords_RightRunId ON dbo.ComparisonRecords;

        ALTER TABLE dbo.ComparisonRecords DROP COLUMN LeftRunId;

        ALTER TABLE dbo.ComparisonRecords DROP COLUMN RightRunId;

        EXEC sp_rename N'dbo.ComparisonRecords.LeftRunIdGuid', N'LeftRunId', N'COLUMN';

        EXEC sp_rename N'dbo.ComparisonRecords.RightRunIdGuid', N'RightRunId', N'COLUMN';
    END;
    ELSE IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
        WHERE c.object_id = OBJECT_ID(N'dbo.ComparisonRecords')
          AND c.name = N'LeftRunId'
          AND ty.name = N'uniqueidentifier')
        PRINT N'TB-006: LeftRunId already UNIQUEIDENTIFIER; ensuring indexes/FKs in follow-on batch.';
END;
GO

IF OBJECT_ID(N'dbo.ComparisonRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ComparisonRecords', N'LeftRunId') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.ComparisonRecords')
         AND c.name = N'LeftRunId'
         AND ty.name = N'uniqueidentifier')
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.ComparisonRecords')
          AND name = N'IX_ComparisonRecords_LeftRunId')
        CREATE NONCLUSTERED INDEX IX_ComparisonRecords_LeftRunId
            ON dbo.ComparisonRecords (LeftRunId);

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.ComparisonRecords')
          AND name = N'IX_ComparisonRecords_RightRunId')
        CREATE NONCLUSTERED INDEX IX_ComparisonRecords_RightRunId
            ON dbo.ComparisonRecords (RightRunId);

    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = N'FK_ComparisonRecords_Runs_LeftRunIdGuid'
          AND parent_object_id = OBJECT_ID(N'dbo.ComparisonRecords'))
        ALTER TABLE dbo.ComparisonRecords WITH CHECK
            ADD CONSTRAINT FK_ComparisonRecords_Runs_LeftRunIdGuid FOREIGN KEY (LeftRunId) REFERENCES dbo.Runs (RunId);

    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = N'FK_ComparisonRecords_Runs_RightRunIdGuid'
          AND parent_object_id = OBJECT_ID(N'dbo.ComparisonRecords'))
        ALTER TABLE dbo.ComparisonRecords WITH CHECK
            ADD CONSTRAINT FK_ComparisonRecords_Runs_RightRunIdGuid FOREIGN KEY (RightRunId) REFERENCES dbo.Runs (RunId);
END;
GO
