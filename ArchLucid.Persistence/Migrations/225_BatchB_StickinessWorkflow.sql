/*
  TB-058 / TB-059 — finding disposition columns + first-class risk exceptions (waivers).
*/

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingReviewEvents', N'Disposition') IS NULL
    ALTER TABLE dbo.FindingReviewEvents ADD Disposition NVARCHAR(64) NULL;
GO

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingReviewEvents', N'RevisitDueUtc') IS NULL
    ALTER TABLE dbo.FindingReviewEvents ADD RevisitDueUtc DATETIME2 NULL;
GO

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingReviewEvents', N'EvidenceRequestText') IS NULL
    ALTER TABLE dbo.FindingReviewEvents ADD EvidenceRequestText NVARCHAR(MAX) NULL;
GO

IF OBJECT_ID(N'dbo.RiskExceptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RiskExceptions
    (
        RiskExceptionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RiskExceptions PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        FindingId NVARCHAR(200) NOT NULL,
        RunId UNIQUEIDENTIFIER NULL,
        ManifestId UNIQUEIDENTIFIER NULL,
        OwnerUserId NVARCHAR(256) NOT NULL,
        Rationale NVARCHAR(MAX) NOT NULL,
        EvidenceRef NVARCHAR(500) NULL,
        ExpiresAtUtc DATETIME2 NOT NULL,
        Status NVARCHAR(32) NOT NULL,
        CreatedAtUtc DATETIME2 NOT NULL,
        CreatedByUserId NVARCHAR(256) NOT NULL,
        RevokedAtUtc DATETIME2 NULL,
        RevokedByUserId NVARCHAR(256) NULL
    );

    CREATE NONCLUSTERED INDEX IX_RiskExceptions_Tenant_Finding
        ON dbo.RiskExceptions (TenantId, FindingId, Status);

    CREATE NONCLUSTERED INDEX IX_RiskExceptions_Tenant_Expires
        ON dbo.RiskExceptions (TenantId, ExpiresAtUtc, Status);
END;
GO
