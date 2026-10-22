/*
  R238: Rollback 238_DecisioningTraces_RuleActionFindingIds.sql — drop action-specific finding-id JSON columns.
*/

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DecisioningTraces', N'PreferredFindingIdsJson') IS NOT NULL
    ALTER TABLE dbo.DecisioningTraces DROP COLUMN PreferredFindingIdsJson;

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DecisioningTraces', N'AllowedFindingIdsJson') IS NOT NULL
    ALTER TABLE dbo.DecisioningTraces DROP COLUMN AllowedFindingIdsJson;

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DecisioningTraces', N'RequiredFindingIdsJson') IS NOT NULL
    ALTER TABLE dbo.DecisioningTraces DROP COLUMN RequiredFindingIdsJson;
GO
