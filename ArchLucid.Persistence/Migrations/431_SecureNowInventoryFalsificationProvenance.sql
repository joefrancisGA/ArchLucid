/* 431: Add optional structured inventory verification provenance without backfilling historical explanations. */
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathExplanations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.SecurityEvidencePathExplanations', N'InventoryFalsificationJson') IS NULL
BEGIN
    ALTER TABLE dbo.SecurityEvidencePathExplanations
        ADD InventoryFalsificationJson NVARCHAR(MAX) NULL;
END;
GO
