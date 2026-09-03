SET NOCOUNT ON;
GO

SET XACT_ABORT ON;
GO

/*
  344: Widen workflow environment columns NVARCHAR(32) -> NVARCHAR(64).

        Custom environment catalog slugs (DbUp 336) and activations (DbUp 143) already allow 64 chars;
        approval requests and promotion records were still capped at 32, causing SQL truncation when
        administrators configured longer slugs.

        Idempotent: skips when columns are already wider than legacy 32 code units.
*/

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns AS c
       INNER JOIN sys.types AS t ON c.user_type_id = t.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests')
         AND c.name = N'SourceEnvironment'
         AND t.name = N'nvarchar'
         AND c.max_length > 0
         AND c.max_length < 128)
BEGIN
    ALTER TABLE dbo.GovernanceApprovalRequests
        ALTER COLUMN SourceEnvironment NVARCHAR(64) NOT NULL;

    ALTER TABLE dbo.GovernanceApprovalRequests
        ALTER COLUMN TargetEnvironment NVARCHAR(64) NOT NULL;
END;

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns AS c
       INNER JOIN sys.types AS t ON c.user_type_id = t.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords')
         AND c.name = N'SourceEnvironment'
         AND t.name = N'nvarchar'
         AND c.max_length > 0
         AND c.max_length < 128)
BEGIN
    ALTER TABLE dbo.GovernancePromotionRecords
        ALTER COLUMN SourceEnvironment NVARCHAR(64) NOT NULL;

    ALTER TABLE dbo.GovernancePromotionRecords
        ALTER COLUMN TargetEnvironment NVARCHAR(64) NOT NULL;
END;

GO
