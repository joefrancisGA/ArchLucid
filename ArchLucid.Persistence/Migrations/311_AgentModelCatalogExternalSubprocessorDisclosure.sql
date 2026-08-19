/*
  311: External-subprocessor disclosure gate column (TB-2109).
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.AgentModelCatalogEntry', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentModelCatalogEntry', N'ExternalSubprocessorDisclosureComplete') IS NULL
BEGIN
    ALTER TABLE dbo.AgentModelCatalogEntry
        ADD ExternalSubprocessorDisclosureComplete BIT NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_ExternalSubprocessorDisclosureComplete DEFAULT (0);
END;
GO
