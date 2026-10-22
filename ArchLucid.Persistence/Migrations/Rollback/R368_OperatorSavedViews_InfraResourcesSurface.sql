/*
  R368: Rollback 368_OperatorSavedViews_InfraResourcesSurface.sql — restore prior surface check.
*/

IF OBJECT_ID(N'dbo.OperatorSavedViews', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_OperatorSavedViews_Surface'
          AND parent_object_id = OBJECT_ID(N'dbo.OperatorSavedViews'))
    BEGIN
        ALTER TABLE dbo.OperatorSavedViews DROP CONSTRAINT CK_OperatorSavedViews_Surface;
    END

    ALTER TABLE dbo.OperatorSavedViews
        ADD CONSTRAINT CK_OperatorSavedViews_Surface
            CHECK (Surface IN (N'audit', N'graph'));
END
