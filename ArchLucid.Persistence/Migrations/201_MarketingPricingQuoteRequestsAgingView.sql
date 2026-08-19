/*
  201: Sales acknowledgement SLA view for marketing pricing quote requests.

  Exposes age and derived BreachStatus without modifying dbo.MarketingPricingQuoteRequests columns.
*/
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
