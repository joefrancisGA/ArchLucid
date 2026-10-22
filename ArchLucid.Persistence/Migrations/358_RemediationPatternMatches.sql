/*
  358: Remediation pattern match results and conflicts (IE-11).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.RemediationPatternMatchResults', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RemediationPatternMatchResults
    (
        MatchResultId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RemediationPatternMatchResults PRIMARY KEY CLUSTERED,
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        FindingId       UNIQUEIDENTIFIER NOT NULL,
        PatternId       UNIQUEIDENTIFIER NOT NULL,
        VersionId       UNIQUEIDENTIFIER NOT NULL,
        PatternKey      NVARCHAR(256)     NOT NULL,
        PatternVersion  NVARCHAR(64)      NOT NULL,
        MatchKind       INT               NOT NULL,
        MatchSource     INT               NOT NULL,
        ExplainText     NVARCHAR(2000)    NOT NULL,
        IsActive        BIT               NOT NULL,
        MatchedUtc      DATETIME2         NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_RemediationPatternMatchResults_Tenant_Finding
        ON dbo.RemediationPatternMatchResults (TenantId, FindingId, IsActive, MatchedUtc DESC);
END;
GO

IF OBJECT_ID(N'dbo.RemediationPatternMatchConflicts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RemediationPatternMatchConflicts
    (
        ConflictId              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RemediationPatternMatchConflicts PRIMARY KEY CLUSTERED,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        FindingId               UNIQUEIDENTIFIER NOT NULL,
        ConflictType            INT               NOT NULL,
        Description             NVARCHAR(2000)    NOT NULL,
        CandidatePatternIdsJson NVARCHAR(4000)    NOT NULL,
        CreatedUtc              DATETIME2         NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_RemediationPatternMatchConflicts_Tenant_Finding
        ON dbo.RemediationPatternMatchConflicts (TenantId, FindingId, CreatedUtc DESC);
END;
GO
