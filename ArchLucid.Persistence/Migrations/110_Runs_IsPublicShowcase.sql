IF COL_LENGTH(N'dbo.Runs', N'IsPublicShowcase') IS NULL
    ALTER TABLE dbo.Runs ADD IsPublicShowcase BIT NOT NULL CONSTRAINT DF_Runs_IsPublicShowcase DEFAULT (0);
GO

/* Contoso demo committed runs — safe public marketing showcase surface */
UPDATE dbo.Runs
SET IsPublicShowcase = 1
WHERE RunId IN ('6E8C4A10-2B1F-4C9A-9D3E-10B2A4F0C501', '6E8C4A10-2B1F-4C9A-9D3E-10B2A4F0C502')
  AND GoldenManifestId IS NOT NULL;
GO
