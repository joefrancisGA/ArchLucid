-- 368: Extend OperatorSavedViews surface check for findings and infrastructure resource explorer presets.

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
            CHECK (Surface IN (N'audit', N'graph', N'findings', N'infra-resources'));
END
