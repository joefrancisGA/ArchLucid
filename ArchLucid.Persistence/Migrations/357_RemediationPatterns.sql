/*
  357: Remediation pattern registry (IE-10).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.RemediationPatterns', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RemediationPatterns
    (
        PatternId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RemediationPatterns PRIMARY KEY CLUSTERED,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        PatternKey              NVARCHAR(256)     NOT NULL,
        DisplayName             NVARCHAR(512)     NOT NULL,
        Description             NVARCHAR(2000)    NULL,
        CurrentApprovedVersion  NVARCHAR(64)      NULL,
        CreatedByActorKey       NVARCHAR(256)     NOT NULL,
        CreatedUtc              DATETIME2         NOT NULL,
        UpdatedUtc              DATETIME2         NOT NULL,
        CONSTRAINT UQ_RemediationPatterns_Tenant_Key UNIQUE (TenantId, PatternKey)
    );

    CREATE NONCLUSTERED INDEX IX_RemediationPatterns_Tenant
        ON dbo.RemediationPatterns (TenantId, UpdatedUtc DESC);
END;
GO

IF OBJECT_ID(N'dbo.RemediationPatternVersions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RemediationPatternVersions
    (
        VersionId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RemediationPatternVersions PRIMARY KEY CLUSTERED,
        PatternId               UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        Version                 NVARCHAR(64)      NOT NULL,
        Status                  INT               NOT NULL,
        ControlObjective        NVARCHAR(2000)    NOT NULL,
        ContentJson             NVARCHAR(MAX)     NOT NULL,
        MatchProvider           INT               NULL,
        MatchResourceType       NVARCHAR(256)     NULL,
        MatchControlId          NVARCHAR(256)     NULL,
        MatchSeverityMin        NVARCHAR(64)      NULL,
        MatchPropertyEqualsJson NVARCHAR(4000)    NULL,
        AutomationLevel         INT               NOT NULL,
        AuthorActorKey          NVARCHAR(256)     NOT NULL,
        ApprovedByActorKey      NVARCHAR(256)     NULL,
        ApprovedUtc             DATETIME2         NULL,
        CreatedUtc              DATETIME2         NOT NULL,
        UpdatedUtc              DATETIME2         NOT NULL,
        CONSTRAINT FK_RemediationPatternVersions_Pattern
            FOREIGN KEY (PatternId) REFERENCES dbo.RemediationPatterns (PatternId),
        CONSTRAINT UQ_RemediationPatternVersions_Tenant_Pattern_Version
            UNIQUE (TenantId, PatternId, Version)
    );

    CREATE NONCLUSTERED INDEX IX_RemediationPatternVersions_Tenant_Status
        ON dbo.RemediationPatternVersions (TenantId, Status, UpdatedUtc DESC);
END;
GO
