using ArchLucid.Core.Llm;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Llm;

[Trait("Suite", "Core")]
public sealed class Gpt56AzureOpenAiModelsTests
{
    [Fact]
    public void Deployment_names_match_Foundry_catalog_ids()
    {
        Gpt56AzureOpenAiModels.LunaDeploymentName.Should().Be("gpt-5.6-luna");
        Gpt56AzureOpenAiModels.TerraDeploymentName.Should().Be("gpt-5.6-terra");
        Gpt56AzureOpenAiModels.SolDeploymentName.Should().Be("gpt-5.6-sol");
        Gpt56AzureOpenAiModels.ModelVersion.Should().Be("2026-07-09");
    }

    [Fact]
    public void List_prices_rank_Luna_cheaper_than_Terra_cheaper_than_Sol()
    {
        Gpt56AzureOpenAiModels.LunaInputUsdPerMillionTokens
            .Should()
            .BeLessThan(Gpt56AzureOpenAiModels.TerraInputUsdPerMillionTokens);

        Gpt56AzureOpenAiModels.TerraInputUsdPerMillionTokens
            .Should()
            .BeLessThan(Gpt56AzureOpenAiModels.SolInputUsdPerMillionTokens);

        Gpt56AzureOpenAiModels.LunaOutputUsdPerMillionTokens
            .Should()
            .BeLessThan(Gpt56AzureOpenAiModels.TerraOutputUsdPerMillionTokens);

        Gpt56AzureOpenAiModels.TerraOutputUsdPerMillionTokens
            .Should()
            .BeLessThan(Gpt56AzureOpenAiModels.SolOutputUsdPerMillionTokens);
    }
}
