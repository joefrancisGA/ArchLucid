IF OBJECT_ID(N'dbo.AgentModelCatalogEntry', N'U') IS NULL
    RETURN;
GO

IF OBJECT_ID(N'dbo.DF_AgentModelCatalogEntry_TokenizerProfile', N'D') IS NOT NULL
    ALTER TABLE dbo.AgentModelCatalogEntry DROP CONSTRAINT DF_AgentModelCatalogEntry_TokenizerProfile;
GO

IF OBJECT_ID(N'dbo.DF_AgentModelCatalogEntry_CharsPerToken', N'D') IS NOT NULL
    ALTER TABLE dbo.AgentModelCatalogEntry DROP CONSTRAINT DF_AgentModelCatalogEntry_CharsPerToken;
GO

IF OBJECT_ID(N'dbo.DF_AgentModelCatalogEntry_TokenizerErrorMarginPercent', N'D') IS NOT NULL
    ALTER TABLE dbo.AgentModelCatalogEntry DROP CONSTRAINT DF_AgentModelCatalogEntry_TokenizerErrorMarginPercent;
GO

IF COL_LENGTH(N'dbo.AgentModelCatalogEntry', N'TokenizerProfile') IS NOT NULL
    ALTER TABLE dbo.AgentModelCatalogEntry DROP COLUMN TokenizerProfile;
GO

IF COL_LENGTH(N'dbo.AgentModelCatalogEntry', N'CharsPerToken') IS NOT NULL
    ALTER TABLE dbo.AgentModelCatalogEntry DROP COLUMN CharsPerToken;
GO

IF COL_LENGTH(N'dbo.AgentModelCatalogEntry', N'TokenizerErrorMarginPercent') IS NOT NULL
    ALTER TABLE dbo.AgentModelCatalogEntry DROP COLUMN TokenizerErrorMarginPercent;
GO

IF COL_LENGTH(N'dbo.AgentModelCatalogEntry', N'InputUsdPerMillionTokens') IS NOT NULL
    ALTER TABLE dbo.AgentModelCatalogEntry DROP COLUMN InputUsdPerMillionTokens;
GO

IF COL_LENGTH(N'dbo.AgentModelCatalogEntry', N'OutputUsdPerMillionTokens') IS NOT NULL
    ALTER TABLE dbo.AgentModelCatalogEntry DROP COLUMN OutputUsdPerMillionTokens;
GO

IF COL_LENGTH(N'dbo.AgentModelCatalogEntry', N'ReasoningUsdPerMillionTokens') IS NOT NULL
    ALTER TABLE dbo.AgentModelCatalogEntry DROP COLUMN ReasoningUsdPerMillionTokens;
GO
