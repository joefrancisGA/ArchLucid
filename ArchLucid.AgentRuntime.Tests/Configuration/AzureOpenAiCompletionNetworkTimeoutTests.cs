using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureOpenAiCompletionNetworkTimeoutTests
{
    [Fact]
    public void Chat_completion_sdk_options_default_to_bounded_network_timeout()
    {
        AzureOpenAiCompletionClient.DefaultNetworkTimeout.Should()
            .Be(TimeSpan.FromSeconds(AzureOpenAiOptions.DefaultCompletionNetworkTimeoutSeconds));

        AzureOpenAiCompletionClient.CreateClientOptions().NetworkTimeout.Should()
            .Be(TimeSpan.FromSeconds(60));
    }

    [Theory]
    [InlineData(5)]
    [InlineData(45)]
    [InlineData(180)]
    public void Chat_completion_sdk_options_accept_configured_network_timeout(int seconds)
    {
        AzureOpenAiCompletionClient.CreateClientOptions(TimeSpan.FromSeconds(seconds))
            .NetworkTimeout.Should().Be(TimeSpan.FromSeconds(seconds));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(4)]
    [InlineData(181)]
    public void Chat_completion_sdk_options_reject_out_of_range_network_timeout(int seconds)
    {
        Action create = () => AzureOpenAiCompletionClient.CreateClientOptions(TimeSpan.FromSeconds(seconds));
        create.Should().Throw<ArgumentOutOfRangeException>();
    }
}
