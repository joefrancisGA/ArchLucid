using ArchLucid.AgentRuntime.Prompts;

using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Prompts;

[Trait("Category", "Unit")]
public sealed class CloudProviderAgentPromptComposerTests
{
    [Fact]
    public void ApplySystemPromptAddendum_aws_topology_includes_ec2_guidance()
    {
        string result = CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(
            "base prompt",
            AgentType.Topology,
            CloudProvider.Aws);

        result.Should().Contain("EC2");
        result.Should().Contain("never azurerm");
    }

    [Fact]
    public void ApplySystemPromptAddendum_azure_topology_unchanged()
    {
        CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(
                "base prompt",
                AgentType.Topology,
                CloudProvider.Azure)
            .Should()
            .Be("base prompt");
    }

    [Theory]
    [InlineData(AgentType.Topology)]
    [InlineData(AgentType.Cost)]
    [InlineData(AgentType.Compliance)]
    [InlineData(AgentType.Critic)]
    public void ApplySystemPromptAddendum_cloud_neutral_includes_neutral_guidance(AgentType agentType)
    {
        string result = CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(
            "base prompt",
            agentType,
            CloudProvider.None);

        result.Should().Contain("cloud-neutral");
        result.Should().Contain("Technology Ledger");
        result.Should().Contain("provider-agnostic");
    }

    [Fact]
    public void ApplySystemPromptAddendum_gcp_cost_includes_gcp_guidance()
    {
        CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(
                "base prompt",
                AgentType.Cost,
                CloudProvider.Gcp)
            .Should()
            .Contain("GCE/GKE/Cloud SQL");
    }
}
