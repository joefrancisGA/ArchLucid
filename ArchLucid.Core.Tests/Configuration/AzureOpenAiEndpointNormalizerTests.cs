using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureOpenAiEndpointNormalizerTests
{
    [SkippableFact]
    public void NormalizeForChatCompletions_maps_foundry_project_url_to_classic_openai_host()
    {
        string normalized = AzureOpenAiEndpointNormalizer.NormalizeForChatCompletions(
            "https://oai-archlucid-dev.services.ai.azure.com/api/projects/proj-default");

        normalized.Should().Be("https://oai-archlucid-dev.openai.azure.com/");
    }

    [SkippableFact]
    public void NormalizeForChatCompletions_preserves_classic_openai_host()
    {
        string normalized = AzureOpenAiEndpointNormalizer.NormalizeForChatCompletions(
            "https://oai-archlucid-dev.openai.azure.com");

        normalized.Should().Be("https://oai-archlucid-dev.openai.azure.com/");
    }
}
