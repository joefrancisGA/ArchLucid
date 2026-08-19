/*
  171: Global read-only catalog of platform-promoted policy pack snapshots (tenant-authenticated reads; admin promote/demote).
  Not tenant-scoped — visibility is governed by IsPromoted and row content is snapshotted at promotion time (no cross-tenant PolicyPacks reads for buyers).
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.PolicyPackCatalogEntry', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PolicyPackCatalogEntry
    (
        PolicyPackCatalogEntryId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_PolicyPackCatalogEntry PRIMARY KEY,
        DisplayName              NVARCHAR(256) NOT NULL,
        Description              NVARCHAR(2000) NOT NULL
            CONSTRAINT DF_PolicyPackCatalogEntry_Description DEFAULT (N''),
        PackType                 NVARCHAR(100) NOT NULL,
        SnapshotVersion          NVARCHAR(50) NOT NULL,
        SnapshotContentJson      NVARCHAR(MAX) NOT NULL,
        SourcePolicyPackId       UNIQUEIDENTIFIER NOT NULL,
        IsPromoted               BIT NOT NULL
            CONSTRAINT DF_PolicyPackCatalogEntry_IsPromoted DEFAULT (0),
        CreatedUtc               DATETIME2(7) NOT NULL
            CONSTRAINT DF_PolicyPackCatalogEntry_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc               DATETIME2(7) NOT NULL
            CONSTRAINT DF_PolicyPackCatalogEntry_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        PromotedUtc              DATETIME2(7) NULL,
        DemotedUtc               DATETIME2(7) NULL,
        CONSTRAINT UQ_PolicyPackCatalogEntry_SourcePack UNIQUE (SourcePolicyPackId)
    );

    CREATE NONCLUSTERED INDEX IX_PolicyPackCatalogEntry_IsPromoted_DisplayName
        ON dbo.PolicyPackCatalogEntry (IsPromoted, DisplayName)
        WHERE IsPromoted = 1;
END;
GO
