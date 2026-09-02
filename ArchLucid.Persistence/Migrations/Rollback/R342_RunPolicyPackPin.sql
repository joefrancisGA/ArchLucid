/*
  R342: Rollback 342_RunPolicyPackPin.sql —
  drop run policy pack pin columns.
*/

IF COL_LENGTH(N'dbo.Runs', N'PinnedPolicyPackIdsHashSha256') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs
        DROP COLUMN PinnedPolicyPackIdsHashSha256;
END;
GO

IF COL_LENGTH(N'dbo.Runs', N'PinnedPolicyPackIdsJson') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs
        DROP COLUMN PinnedPolicyPackIdsJson;
END;
GO
