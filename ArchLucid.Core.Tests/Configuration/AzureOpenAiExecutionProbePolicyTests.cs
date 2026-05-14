using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;

public sealed class AzureOpenAiExecutionProbePolicyTests
{
    [Fact]
    public void ShouldProbeConfiguredEndpoint_RealNonEcho_ReturnsTrue()
    {
        Dictionary<string, string?> pairs = new(StringComparer.OrdinalIgnoreCase)
        {
            ["AgentExecution:Mode"] = "Real",
            ["AgentExecution:CompletionClient"] = "AzureOpenAi",
        };

        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection(pairs!).Build();

        AzureOpenAiExecutionProbePolicy.ShouldProbeConfiguredEndpoint(cfg).Should().BeTrue();
    }

    [Fact]
    public void ShouldProbeConfiguredEndpoint_RealEcho_ReturnsFalse()
    {
        Dictionary<string, string?> pairs = new(StringComparer.OrdinalIgnoreCase)
        {
            ["AgentExecution:Mode"] = "Real",
            ["AgentExecution:CompletionClient"] = "Echo",
        };

        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection(pairs!).Build();

        AzureOpenAiExecutionProbePolicy.ShouldProbeConfiguredEndpoint(cfg).Should().BeFalse();
    }

    [Fact]
    public void ShouldProbeConfiguredEndpoint_Simulator_ReturnsFalse()
    {
        Dictionary<string, string?> pairs = new(StringComparer.OrdinalIgnoreCase)
        {
            ["AgentExecution:Mode"] = "Simulator",
            ["AgentExecution:CompletionClient"] = "AzureOpenAi",
        };

        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection(pairs!).Build();

        AzureOpenAiExecutionProbePolicy.ShouldProbeConfiguredEndpoint(cfg).Should().BeFalse();
    }
}
