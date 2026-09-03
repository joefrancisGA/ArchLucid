/*
  R342: Rollback 342_RunPolicyPackPin.sql —
  drop run policy pack pin columns from the physical run/review table
  (dbo.Reviews after ADR 0064, else dbo.Runs).
*/

DECLARE @runTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @sql NVARCHAR(MAX);

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'PinnedPolicyPackIdsHashSha256') IS NOT NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' DROP COLUMN PinnedPolicyPackIdsHashSha256;';

    EXEC sp_executesql @sql;
END

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'PinnedPolicyPackIdsJson') IS NOT NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' DROP COLUMN PinnedPolicyPackIdsJson;';

    EXEC sp_executesql @sql;
END
GO
