/*
  R196: Undo Tenants_DataRegion addition.
*/

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'DataRegion') IS NOT NULL
BEGIN
    DECLARE @DropDefault nvarchar(max);

    SELECT @DropDefault =
        N'ALTER TABLE dbo.Tenants DROP CONSTRAINT ' + QUOTENAME(dc.name) + N';'
    FROM sys.default_constraints AS dc
             INNER JOIN sys.columns AS c
                        ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.Tenants', N'U')
      AND c.name = N'DataRegion';

    IF @DropDefault IS NOT NULL
        EXEC sys.sp_executesql @DropDefault;

    ALTER TABLE dbo.Tenants DROP COLUMN DataRegion;
END;
GO
