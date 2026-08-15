/*
  309: Platform-wide activation registry for bundled policy packs (internal ops).
  Tenants opt in/out per assignment; this table hides packs globally when deactivated.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.PlatformBundledPolicyPackRegistry', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlatformBundledPolicyPackRegistry
    (
        BundleContentFile NVARCHAR(260) NOT NULL
            CONSTRAINT PK_PlatformBundledPolicyPackRegistry PRIMARY KEY,
        DisplayName       NVARCHAR(256) NOT NULL,
        IsGloballyActive  BIT NOT NULL
            CONSTRAINT DF_PlatformBundledPolicyPackRegistry_IsGloballyActive DEFAULT (1),
        UpdatedUtc        DATETIME2(7) NOT NULL
            CONSTRAINT DF_PlatformBundledPolicyPackRegistry_UpdatedUtc DEFAULT SYSUTCDATETIME()
    );

    CREATE UNIQUE NONCLUSTERED INDEX UX_PlatformBundledPolicyPackRegistry_DisplayName
        ON dbo.PlatformBundledPolicyPackRegistry (DisplayName);
END;
GO

/* Bundled platform-default assignments default to selected for all tenants. */
UPDATE a
SET IsEnabled = 1
FROM dbo.PolicyPackAssignments AS a
INNER JOIN dbo.PolicyPacks AS p ON p.PolicyPackId = a.PolicyPackId
WHERE p.PackType = N'PlatformDefault'
  AND a.ArchivedUtc IS NULL
  AND a.IsEnabled = 0;
GO
