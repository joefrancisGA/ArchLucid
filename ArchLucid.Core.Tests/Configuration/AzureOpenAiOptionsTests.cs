using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureOpenAiOptionsTests
{
    [Fact]
    public void Completion_network_timeout_default_is_bounded()
    {
        AzureOpenAiOptions options = new();

        options.CompletionNetworkTimeoutSeconds.Should().Be(60);
        options.GetEffectiveCompletionNetworkTimeout().Should().Be(TimeSpan.FromSeconds(60));
    }

    [Theory]
    [InlineData(1, 5)]
    [InlineData(45, 45)]
    [InlineData(500, 180)]
    public void Completion_network_timeout_is_clamped_defensively(int configured, int expected)
    {
        AzureOpenAiOptions options = new() { CompletionNetworkTimeoutSeconds = configured };

        options.GetEffectiveCompletionNetworkTimeout().Should().Be(TimeSpan.FromSeconds(expected));
    }

    [Fact]
    public void UseJsonSchemaResponseFormat_defaults_to_false_when_configuration_is_unset()
    {
        AzureOpenAiOptions options = new();

        options.UseJsonSchemaResponseFormat.Should().BeFalse();
    }
}
