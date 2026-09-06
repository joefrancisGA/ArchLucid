/*
  Rollback 366: Remove architecture display name columns.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Architectures', N'Description') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Architectures DROP COLUMN Description;
END;
GO

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Architectures', N'DisplayName') IS NOT NULL
BEGIN
    DECLARE @displayNameDefault sysname;

    SELECT @displayNameDefault = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c
        ON c.default_object_id = dc.object_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.Architectures')
      AND c.name = N'DisplayName';

    IF @displayNameDefault IS NOT NULL
        EXEC(N'ALTER TABLE dbo.Architectures DROP CONSTRAINT ' + QUOTENAME(@displayNameDefault) + N';');

    ALTER TABLE dbo.Architectures DROP COLUMN DisplayName;
END;
GO
