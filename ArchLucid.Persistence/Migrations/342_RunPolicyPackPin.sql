/*
  342: Wave-4 robustness — pin theory-in-force policy pack ids on run create.

  - Runs.PinnedPolicyPackIdsJson stores enabled pack ids at create.
  - Runs.PinnedPolicyPackIdsHashSha256 stores canonical hash of the pin JSON.
*/

IF COL_LENGTH(N'dbo.Runs', N'PinnedPolicyPackIdsJson') IS NULL
BEGIN
    ALTER TABLE dbo.Runs
        ADD PinnedPolicyPackIdsJson NVARCHAR(MAX) NULL;
END;
GO

IF COL_LENGTH(N'dbo.Runs', N'PinnedPolicyPackIdsHashSha256') IS NULL
BEGIN
    ALTER TABLE dbo.Runs
        ADD PinnedPolicyPackIdsHashSha256 VARBINARY(32) NULL;
END;
GO
