SET NOCOUNT ON;
GO

/* R101: Rollback 101_Tenants_BaselineReviewCycle.sql — remove baseline review-cycle columns from dbo.Tenants. */

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_Tenants_BaselineReviewCycleHours_Positive'
      AND parent_object_id = OBJECT_ID(N'dbo.Tenants', N'U'))
BEGIN
    ALTER TABLE dbo.Tenants DROP CONSTRAINT CK_Tenants_BaselineReviewCycleHours_Positive;
END;
GO

IF COL_LENGTH(N'dbo.Tenants', N'BaselineReviewCycleCapturedUtc') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Tenants DROP COLUMN BaselineReviewCycleCapturedUtc;
END;
GO

IF COL_LENGTH(N'dbo.Tenants', N'BaselineReviewCycleSource') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Tenants DROP COLUMN BaselineReviewCycleSource;
END;
GO

IF COL_LENGTH(N'dbo.Tenants', N'BaselineReviewCycleHours') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Tenants DROP COLUMN BaselineReviewCycleHours;
END;
GO
