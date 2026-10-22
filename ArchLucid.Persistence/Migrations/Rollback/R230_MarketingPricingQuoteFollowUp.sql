IF OBJECT_ID(N'dbo.MarketingPricingQuoteRequestsAging', N'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.MarketingPricingQuoteRequestsAging;
END;
GO

IF OBJECT_ID(N'dbo.MarketingPricingQuoteRequests', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.MarketingPricingQuoteRequests', N'ClosedUtc') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.MarketingPricingQuoteRequests DROP COLUMN ClosedUtc;
    END;

    IF COL_LENGTH(N'dbo.MarketingPricingQuoteRequests', N'AssignedOwner') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.MarketingPricingQuoteRequests DROP COLUMN AssignedOwner;
    END;

    IF COL_LENGTH(N'dbo.MarketingPricingQuoteRequests', N'FirstResponseUtc') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.MarketingPricingQuoteRequests DROP COLUMN FirstResponseUtc;
    END;

    IF COL_LENGTH(N'dbo.MarketingPricingQuoteRequests', N'Status') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.MarketingPricingQuoteRequests DROP CONSTRAINT DF_MarketingPricingQuoteRequests_Status;
        ALTER TABLE dbo.MarketingPricingQuoteRequests DROP COLUMN Status;
    END;
END;
GO

IF OBJECT_ID(N'dbo.MarketingPricingQuoteRequests', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.MarketingPricingQuoteRequestsAging', N'V') IS NULL
BEGIN
    EXEC(N'
CREATE VIEW dbo.MarketingPricingQuoteRequestsAging AS
SELECT
    r.Id,
    r.WorkEmail,
    r.CompanyName,
    r.TierInterest,
    r.CreatedUtc,
    CAST(DATEDIFF(SECOND, r.CreatedUtc, SYSUTCDATETIME()) AS DECIMAL(18, 4)) / 3600.0 AS AgeHours,
    CASE
        WHEN DATEDIFF(HOUR, r.CreatedUtc, SYSUTCDATETIME()) >= 24 THEN N''breach at 24h''
        WHEN DATEDIFF(HOUR, r.CreatedUtc, SYSUTCDATETIME()) >= 18 THEN N''warn at 18h''
        ELSE N''ok''
    END AS BreachStatus
FROM dbo.MarketingPricingQuoteRequests AS r;
');
END;
GO
