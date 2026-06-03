using ArchLucid.AgentRuntime;

using ArchLucid.Core.Llm;

using FluentAssertions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DefaultLlmProviderFactoryTests
{
    [Fact]
    public void CreateClient_returns_adapter_for_azure_descriptor()
    {
        Mock<IAgentCompletionClient> client = new();
        client.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForAzureOpenAi(new Uri("https://aoai.example"), "gpt-4o"));

        DefaultLlmProviderFactory sut = new(client.Object);
        LlmProviderFactoryDescriptor descriptor = new(
            LlmProviderType.AzureOpenAi,
            "azure-openai",
            "gpt-4o");

        Core.Llm.IAgentCompletionClient created = sut.CreateClient(descriptor);

        created.Should().NotBeNull();
    }

    [Fact]
    public void CreateClient_throws_for_unregistered_provider_type()
    {
        Mock<IAgentCompletionClient> client = new();
        client.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForAzureOpenAi(new Uri("https://aoai.example"), "gpt-4o"));

        DefaultLlmProviderFactory sut = new(client.Object);
        LlmProviderFactoryDescriptor descriptor = new(LlmProviderType.Anthropic, "anthropic", "claude-3");

        Action act = () => sut.CreateClient(descriptor);

        act.Should().Throw<NotSupportedException>();
    }
}
