IF OBJECT_ID(N'dbo.AgentModelCatalogEntry', N'U') IS NULL
    RETURN;
GO

IF OBJECT_ID(N'dbo.DF_AgentModelCatalogEntry_ExternalSubprocessorDisclosureComplete', N'D') IS NOT NULL
    ALTER TABLE dbo.AgentModelCatalogEntry DROP CONSTRAINT DF_AgentModelCatalogEntry_ExternalSubprocessorDisclosureComplete;
GO

IF COL_LENGTH(N'dbo.AgentModelCatalogEntry', N'ExternalSubprocessorDisclosureComplete') IS NOT NULL
    ALTER TABLE dbo.AgentModelCatalogEntry DROP COLUMN ExternalSubprocessorDisclosureComplete;
GO
