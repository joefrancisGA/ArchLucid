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
}
