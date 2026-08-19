-- Allow multiple unresolved review reasons per legacy source row (e.g. missing Entra tenant + missing workspace).
IF OBJECT_ID(N'dbo.IdentityMigrationReviewItems', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.key_constraints
       WHERE name = N'UQ_IdentityMigrationReviewItems_LegacySource'
         AND parent_object_id = OBJECT_ID(N'dbo.IdentityMigrationReviewItems'))
BEGIN
    ALTER TABLE dbo.IdentityMigrationReviewItems
        DROP CONSTRAINT UQ_IdentityMigrationReviewItems_LegacySource;
END;
GO

IF OBJECT_ID(N'dbo.IdentityMigrationReviewItems', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.key_constraints
       WHERE name = N'UQ_IdentityMigrationReviewItems_LegacySourceReason'
         AND parent_object_id = OBJECT_ID(N'dbo.IdentityMigrationReviewItems'))
BEGIN
    ALTER TABLE dbo.IdentityMigrationReviewItems
        ADD CONSTRAINT UQ_IdentityMigrationReviewItems_LegacySourceReason
            UNIQUE (LegacySourceType, LegacySourceId, ReasonCode);
END;
GO
