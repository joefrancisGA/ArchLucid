-- Rollback for 193_FindingsSnapshots_HasWarnings.sql

IF COL_LENGTH(N'dbo.FindingsSnapshots', N'HasWarnings') IS NOT NULL
BEGIN
    DECLARE @dfName sysname;
    SELECT @dfName = dc.name
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS c
        ON c.default_object_id = dc.object_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.FindingsSnapshots')
      AND c.name = N'HasWarnings';

    IF @dfName IS NOT NULL
        EXEC (N'ALTER TABLE dbo.FindingsSnapshots DROP CONSTRAINT ' + QUOTENAME(@dfName) + N';');

    ALTER TABLE dbo.FindingsSnapshots DROP COLUMN HasWarnings;
END;
GO
