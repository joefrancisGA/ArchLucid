SET NOCOUNT ON;
GO

/* 101: Tenant baseline review-cycle capture (trial signup; optional prospect hours + source). */

IF COL_LENGTH(N'dbo.Tenants', N'BaselineReviewCycleHours') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD
        BaselineReviewCycleHours DECIMAL(9,2) NULL,
        BaselineReviewCycleSource NVARCHAR(256) NULL,
        BaselineReviewCycleCapturedUtc DATETIMEOFFSET(7) NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_Tenants_BaselineReviewCycleHours_Positive'
      AND parent_object_id = OBJECT_ID(N'dbo.Tenants', N'U'))
BEGIN
    ALTER TABLE dbo.Tenants ADD CONSTRAINT CK_Tenants_BaselineReviewCycleHours_Positive
        CHECK (BaselineReviewCycleHours IS NULL OR BaselineReviewCycleHours > 0);
END;
GO
