/*
  TB-204 — persist require/allow/prefer finding-id sets on authority rule audit traces.
*/

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DecisioningTraces', N'RequiredFindingIdsJson') IS NULL
    ALTER TABLE dbo.DecisioningTraces ADD RequiredFindingIdsJson NVARCHAR(MAX) NULL;

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DecisioningTraces', N'AllowedFindingIdsJson') IS NULL
    ALTER TABLE dbo.DecisioningTraces ADD AllowedFindingIdsJson NVARCHAR(MAX) NULL;

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DecisioningTraces', N'PreferredFindingIdsJson') IS NULL
    ALTER TABLE dbo.DecisioningTraces ADD PreferredFindingIdsJson NVARCHAR(MAX) NULL;
GO
