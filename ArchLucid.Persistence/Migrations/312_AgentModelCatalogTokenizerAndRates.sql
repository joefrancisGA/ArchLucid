/*
  312: Per-engine tokenizer profile + USD rate columns (TB-2107 / ADR 0065 D6).
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.AgentModelCatalogEntry', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentModelCatalogEntry', N'TokenizerProfile') IS NULL
BEGIN
    ALTER TABLE dbo.AgentModelCatalogEntry
        ADD TokenizerProfile NVARCHAR(32) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_TokenizerProfile DEFAULT (N'CharHeuristic'),
            CharsPerToken INT NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_CharsPerToken DEFAULT (4),
            TokenizerErrorMarginPercent DECIMAL(5, 2) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_TokenizerErrorMarginPercent DEFAULT (25.00),
            InputUsdPerMillionTokens DECIMAL(18, 6) NULL,
            OutputUsdPerMillionTokens DECIMAL(18, 6) NULL,
            ReasoningUsdPerMillionTokens DECIMAL(18, 6) NULL;
END;
GO
