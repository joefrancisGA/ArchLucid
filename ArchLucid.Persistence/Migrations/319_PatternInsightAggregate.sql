-- TB-880: k-anonymous cross-tenant pattern insight aggregates
IF OBJECT_ID(N'dbo.PatternInsightAggregate', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PatternInsightAggregate
    (
        PatternKey NVARCHAR(128) NOT NULL,
        IndustryVertical NVARCHAR(64) NOT NULL,
        Summary NVARCHAR(2000) NOT NULL,
        ContributingTenantCount INT NOT NULL,
        CONSTRAINT PK_PatternInsightAggregate PRIMARY KEY (PatternKey, IndustryVertical)
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.PatternInsightAggregate WHERE PatternKey = N'private-endpoints-paas')
BEGIN
    INSERT INTO dbo.PatternInsightAggregate (PatternKey, IndustryVertical, Summary, ContributingTenantCount)
    VALUES
    (
        N'private-endpoints-paas',
        N'FinancialServices',
        N'Peers often adopt private endpoints for SQL and storage planes in regulated workloads.',
        12
    ),
    (
        N'three-tier-appservice',
        N'General',
        N'Three-tier App Service + Azure SQL remains a common modernization target across pilots.',
        18
    ),
    (
        N'below-k-omitted',
        N'General',
        N'Should never surface to buyers.',
        2
    );
END;
