using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

public sealed class DelegatingLlmCompletionProviderTests
{
    [Fact]
    public async Task Forwards_completion_and_exposes_labels()
    {
        Uri baseUri = new("https://example.openai.azure.com/");
        IAgentCompletionClient inner = new FakeAgentCompletionClient(
            (_, _) => """{"ok":true}""",
            LlmProviderDescriptor.ForAzureOpenAi(baseUri, "inner-model"));
        ILlmCompletionProvider sut = new DelegatingLlmCompletionProvider(inner, "azure-openai", "gpt-deployment");

        sut.ProviderId.Should().Be("azure-openai");
        sut.ModelDeploymentLabel.Should().Be("gpt-deployment");
        sut.Descriptor.ProviderKind.Should().Be("azure-openai");
        sut.Descriptor.ModelId.Should().Be("gpt-deployment");
        sut.Descriptor.ApiBaseUri.Should().Be(baseUri);
        sut.Descriptor.AuthScheme.Should().Be(LlmProviderAuthScheme.ApiKey);

        string result = await sut.CompleteJsonAsync("sys", "user");

        result.Should().Contain("ok");
    }
}
