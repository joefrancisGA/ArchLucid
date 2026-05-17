/*
  169: Tenant-selected data residency (dbo.Tenants.DataRegion).

  Normalized geography key binds optional per-region ArtifactLargePayload Azure blob URIs.
*/
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'DataRegion') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD
        DataRegion NVARCHAR(64) NOT NULL CONSTRAINT DF_Tenants_DataRegion DEFAULT N'default';
END;
GO
