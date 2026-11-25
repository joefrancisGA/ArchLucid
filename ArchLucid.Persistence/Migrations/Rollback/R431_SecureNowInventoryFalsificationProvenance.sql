/*
  R431 - Manual-only. Dropping this nullable column permanently discards structured
  verifier history. Prefer leaving it in place when rolling back the application.
  Stop dependent application instances and retain a verified backup before removal.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathExplanations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.SecurityEvidencePathExplanations', N'InventoryFalsificationJson') IS NOT NULL
BEGIN
    ALTER TABLE dbo.SecurityEvidencePathExplanations
        DROP COLUMN InventoryFalsificationJson;
END;
GO
