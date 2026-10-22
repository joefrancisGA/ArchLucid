/*
  162: Global host override for AgentExecution:LlmCostEstimation input/output USD-per-million rates (admin API).

  Single-row table (SingletonKey = N'G'). Application MERGE via SqlLlmCostEstimationUsdRateOverrideRepository.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.HostLlmCostEstimationUsdRates', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HostLlmCostEstimationUsdRates
    (
        SingletonKey              NCHAR(1)      NOT NULL,
        InputUsdPerMillionTokens  DECIMAL(18, 8) NOT NULL,
        OutputUsdPerMillionTokens DECIMAL(18, 8) NOT NULL,
        UpdatedUtc                DATETIME2(7)  NOT NULL,
        UpdatedBy                 NVARCHAR(256) NOT NULL,
        CONSTRAINT PK_HostLlmCostEstimationUsdRates PRIMARY KEY (SingletonKey),
        CONSTRAINT CK_HostLlmCostEstimationUsdRates_Singleton CHECK (SingletonKey = N'G'),
        CONSTRAINT CK_HostLlmCostEstimationUsdRates_InputPositive CHECK (InputUsdPerMillionTokens > 0),
        CONSTRAINT CK_HostLlmCostEstimationUsdRates_OutputPositive CHECK (OutputUsdPerMillionTokens > 0)
    );
END;
GO
