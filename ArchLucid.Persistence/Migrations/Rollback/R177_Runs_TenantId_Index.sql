/*
  Roll back DbUp 177 — drop IX_Runs_TenantId.
*/

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Runs_TenantId'
      AND object_id = OBJECT_ID(N'dbo.Runs'))
BEGIN
    DROP INDEX IX_Runs_TenantId ON dbo.Runs;
END;
GO
