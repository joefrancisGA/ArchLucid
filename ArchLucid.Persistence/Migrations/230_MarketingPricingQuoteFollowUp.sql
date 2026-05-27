/*
  230: Sales follow-up columns for marketing pricing quote requests (Batch F — improvement #10).

  Status + FirstResponseUtc drive SLA aging; AssignedOwner supports operator triage.
*/
IF OBJECT_ID(N'dbo.MarketingPricingQuoteRequests', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.MarketingPricingQuoteRequests', N'Status') IS NULL
    BEGIN
        ALTER TABLE dbo.MarketingPricingQuoteRequests
            ADD Status NVARCHAR(32) NOT NULL
                CONSTRAINT DF_MarketingPricingQuoteRequests_Status DEFAULT N'Open';
    END;

    IF COL_LENGTH(N'dbo.MarketingPricingQuoteRequests', N'FirstResponseUtc') IS NULL
    BEGIN
        ALTER TABLE dbo.MarketingPricingQuoteRequests
            ADD FirstResponseUtc DATETIME2(7) NULL;
    END;

    IF COL_LENGTH(N'dbo.MarketingPricingQuoteRequests', N'AssignedOwner') IS NULL
    BEGIN
        ALTER TABLE dbo.MarketingPricingQuoteRequests
            ADD AssignedOwner NVARCHAR(200) NULL;
    END;

    IF COL_LENGTH(N'dbo.MarketingPricingQuoteRequests', N'ClosedUtc') IS NULL
    BEGIN
        ALTER TABLE dbo.MarketingPricingQuoteRequests
            ADD ClosedUtc DATETIME2(7) NULL;
    END;
END;
GO

IF OBJECT_ID(N'dbo.MarketingPricingQuoteRequestsAging', N'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.MarketingPricingQuoteRequestsAging;
END;
GO

IF OBJECT_ID(N'dbo.MarketingPricingQuoteRequests', N'U') IS NOT NULL
BEGIN
    EXEC(N'
CREATE VIEW dbo.MarketingPricingQuoteRequestsAging AS
SELECT
    r.Id,
    r.WorkEmail,
    r.CompanyName,
    r.TierInterest,
    r.CreatedUtc,
    r.Status,
    r.FirstResponseUtc,
    r.AssignedOwner,
    CAST(DATEDIFF(SECOND, r.CreatedUtc, SYSUTCDATETIME()) AS DECIMAL(18, 4)) / 3600.0 AS AgeHours,
    CASE
        WHEN DATEDIFF(HOUR, r.CreatedUtc, SYSUTCDATETIME()) >= 24 THEN N''breach at 24h''
        WHEN DATEDIFF(HOUR, r.CreatedUtc, SYSUTCDATETIME()) >= 18 THEN N''warn at 18h''
        ELSE N''ok''
    END AS BreachStatus
FROM dbo.MarketingPricingQuoteRequests AS r
WHERE r.Status = N''Open''
  AND r.FirstResponseUtc IS NULL;
');
END;
GO
