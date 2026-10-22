/*
  398: AX-DC-04 — persist materialized completeness warning strings on inventory snapshots.
*/

SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.AzureInventorySnapshots', N'CompletenessWarningsJson') IS NULL
BEGIN
    ALTER TABLE dbo.AzureInventorySnapshots
        ADD CompletenessWarningsJson NVARCHAR(MAX) NULL;
END;
GO
