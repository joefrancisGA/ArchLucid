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

    [SkippableFact]
    public void NormalizeForChatCompletions_appends_trailing_slash_to_path_before_query_on_cognitiveservices_host()
    {
        string normalized = AzureOpenAiEndpointNormalizer.NormalizeForChatCompletions(
            "https://oai-archlucid-dev.cognitiveservices.azure.com/openai?api-version=2024-02-01");

        normalized.Should().Be(
            "https://oai-archlucid-dev.cognitiveservices.azure.com/openai/?api-version=2024-02-01");
    }

    [SkippableFact]
    public void NormalizeForChatCompletions_prepends_https_when_azure_openai_endpoint_omits_scheme()
    {
        string normalized = AzureOpenAiEndpointNormalizer.NormalizeForChatCompletions(
            "oai-archlucid-dev.openai.azure.com");

        normalized.Should().Be("https://oai-archlucid-dev.openai.azure.com/");

        new Uri(normalized).Host.Should().Be("oai-archlucid-dev.openai.azure.com");
    }

    [SkippableFact]
    public void NormalizeForChatCompletions_upgrades_http_to_https_for_openai_azure_host()
    {
        string normalized = AzureOpenAiEndpointNormalizer.NormalizeForChatCompletions(
            "http://oai-archlucid-dev.openai.azure.com");

        normalized.Should().Be("https://oai-archlucid-dev.openai.azure.com/");
    }

    [SkippableFact]
    public void NormalizeForChatCompletions_does_not_upgrade_http_when_only_query_contains_azure_openai_host_marker()
    {
        string normalized = AzureOpenAiEndpointNormalizer.NormalizeForChatCompletions(
            "http://evil.example.com?mirror=openai.azure.com");

        normalized.Should().StartWith("http://evil.example.com");
    }
}
