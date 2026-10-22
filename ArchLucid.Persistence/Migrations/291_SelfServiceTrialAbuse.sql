/*
  291: Self-service trial abuse tracking (email lifetime cap + domain velocity).
  Renumbered from duplicate 287 prefix (Quick Scan concurrency owns 287).
*/
IF OBJECT_ID(N'dbo.PlatformSelfServiceTrialEmailClaims', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlatformSelfServiceTrialEmailClaims
    (
        NormalizedEmail   NVARCHAR(320)    NOT NULL
            CONSTRAINT PK_PlatformSelfServiceTrialEmailClaims PRIMARY KEY,
        PlatformUserId    UNIQUEIDENTIFIER NULL,
        TenantId          UNIQUEIDENTIFIER NULL,
        ClaimSource       NVARCHAR(64)     NOT NULL,
        ClaimedUtc        DATETIME2(7)     NOT NULL
            CONSTRAINT DF_PlatformSelfServiceTrialEmailClaims_ClaimedUtc DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID(N'dbo.PlatformSelfServiceTrialDomainClaims', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlatformSelfServiceTrialDomainClaims
    (
        Id                BIGINT           NOT NULL IDENTITY(1,1)
            CONSTRAINT PK_PlatformSelfServiceTrialDomainClaims PRIMARY KEY,
        NormalizedDomain  NVARCHAR(253)    NOT NULL,
        ClaimedUtc        DATETIME2(7)     NOT NULL
            CONSTRAINT DF_PlatformSelfServiceTrialDomainClaims_ClaimedUtc DEFAULT SYSUTCDATETIME()
    );

    CREATE INDEX IX_PlatformSelfServiceTrialDomainClaims_Domain_ClaimedUtc
        ON dbo.PlatformSelfServiceTrialDomainClaims (NormalizedDomain, ClaimedUtc DESC);
END;
GO
