SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.TenantCostSettings', N'EaDiscountMultiplier') IS NOT NULL
BEGIN
    ALTER TABLE dbo.TenantCostSettings DROP CONSTRAINT IF EXISTS CK_TenantCostSettings_EaDiscountMultiplier;
    ALTER TABLE dbo.TenantCostSettings DROP CONSTRAINT IF EXISTS DF_TenantCostSettings_EaDiscountMultiplier;
    ALTER TABLE dbo.TenantCostSettings DROP COLUMN EaDiscountMultiplier;
END;
GO
