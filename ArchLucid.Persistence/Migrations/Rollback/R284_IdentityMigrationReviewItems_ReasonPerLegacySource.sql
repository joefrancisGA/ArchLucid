/*
  R284: Rollback 284_IdentityMigrationReviewItems_ReasonPerLegacySource.sql — restore legacy-source unique key.
*/

IF OBJECT_ID(N'dbo.IdentityMigrationReviewItems', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.key_constraints
       WHERE name = N'UQ_IdentityMigrationReviewItems_LegacySourceReason'
         AND parent_object_id = OBJECT_ID(N'dbo.IdentityMigrationReviewItems'))
BEGIN
    ALTER TABLE dbo.IdentityMigrationReviewItems
        DROP CONSTRAINT UQ_IdentityMigrationReviewItems_LegacySourceReason;
END;
GO

IF OBJECT_ID(N'dbo.IdentityMigrationReviewItems', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.key_constraints
       WHERE name = N'UQ_IdentityMigrationReviewItems_LegacySource'
         AND parent_object_id = OBJECT_ID(N'dbo.IdentityMigrationReviewItems'))
BEGIN
    ALTER TABLE dbo.IdentityMigrationReviewItems
        ADD CONSTRAINT UQ_IdentityMigrationReviewItems_LegacySource
            UNIQUE (LegacySourceType, LegacySourceId);
END;
GO
