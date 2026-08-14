using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Llm;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class AgentModelCatalogTokenMathTests
{
    [Fact]
    public void EstimateTokensFromCharCount_uses_catalog_chars_per_token()
    {
        AgentModelAliasRegistryEntry entry = new()
        {
            AliasId = AgentModelAliasIds.StandardGeneral,
            ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
            DeploymentName = Gpt56AzureOpenAiModels.TerraDeploymentName,
            CapabilityTags = [],
            ApprovedTaskTypes = [],
            CharsPerToken = 2,
        };

        AgentModelCatalogTokenMath.EstimateTokensFromCharCount(9, entry).Should().Be(5);
    }

    [Fact]
    public void ResolveUsdRatesForTier_matches_gpt56_list_prices()
    {
        (decimal input, decimal output, decimal reasoning) =
            AgentModelCatalogPricingDefaults.ResolveUsdRatesForTier(LlmModelTier.Standard);

        input.Should().Be(Gpt56AzureOpenAiModels.TerraInputUsdPerMillionTokens);
        output.Should().Be(Gpt56AzureOpenAiModels.TerraOutputUsdPerMillionTokens);
        reasoning.Should().Be(Gpt56AzureOpenAiModels.TerraOutputUsdPerMillionTokens);
    }
}
