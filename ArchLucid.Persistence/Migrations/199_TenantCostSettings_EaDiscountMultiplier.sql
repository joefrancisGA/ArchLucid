SET NOCOUNT ON;
GO

/* 199: Enterprise Agreement discount multiplier for tenant ROI cost summation. */

IF COL_LENGTH(N'dbo.TenantCostSettings', N'EaDiscountMultiplier') IS NULL
BEGIN
    ALTER TABLE dbo.TenantCostSettings
        ADD EaDiscountMultiplier DECIMAL(6, 4) NOT NULL
            CONSTRAINT DF_TenantCostSettings_EaDiscountMultiplier DEFAULT (1.0000);
END;
GO

IF COL_LENGTH(N'dbo.TenantCostSettings', N'EaDiscountMultiplier') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_TenantCostSettings_EaDiscountMultiplier')
BEGIN
    ALTER TABLE dbo.TenantCostSettings
        ADD CONSTRAINT CK_TenantCostSettings_EaDiscountMultiplier
            CHECK (EaDiscountMultiplier > 0 AND EaDiscountMultiplier <= 1);
END;
GO
