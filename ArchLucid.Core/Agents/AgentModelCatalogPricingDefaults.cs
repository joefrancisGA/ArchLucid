using ArchLucid.Contracts.Common;
using ArchLucid.Core.Llm;

namespace ArchLucid.Core.Agents;

/// <summary>Default tokenizer + USD/M rates for managed Azure catalog aliases (TB-2107).</summary>
public static class AgentModelCatalogPricingDefaults
{
    public const decimal DefaultTokenizerErrorMarginPercent = 25m;

    public static (decimal InputUsd, decimal OutputUsd, decimal ReasoningUsd) ResolveUsdRatesForTier(LlmModelTier tier)
    {
        return tier switch
        {
            LlmModelTier.Economy => (
                Gpt56AzureOpenAiModels.LunaInputUsdPerMillionTokens,
                Gpt56AzureOpenAiModels.LunaOutputUsdPerMillionTokens,
                Gpt56AzureOpenAiModels.LunaOutputUsdPerMillionTokens),
            LlmModelTier.Premium => (
                Gpt56AzureOpenAiModels.SolInputUsdPerMillionTokens,
                Gpt56AzureOpenAiModels.SolOutputUsdPerMillionTokens,
                Gpt56AzureOpenAiModels.SolOutputUsdPerMillionTokens),
            _ => (
                Gpt56AzureOpenAiModels.TerraInputUsdPerMillionTokens,
                Gpt56AzureOpenAiModels.TerraOutputUsdPerMillionTokens,
                Gpt56AzureOpenAiModels.TerraOutputUsdPerMillionTokens),
        };
    }
}
