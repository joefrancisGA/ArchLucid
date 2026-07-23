using System.Text;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch11Tests
{
    [Theory]
    [InlineData(AgentType.Topology, CloudProvider.Aws, "EC2")]
    [InlineData(AgentType.Topology, CloudProvider.Gcp, "Compute Engine")]
    [InlineData(AgentType.Compliance, CloudProvider.Aws, "CloudTrail")]
    [InlineData(AgentType.Compliance, CloudProvider.Gcp, "Cloud Audit Logs")]
    [InlineData(AgentType.Critic, CloudProvider.Aws, "Security Groups")]
    [InlineData(AgentType.Critic, CloudProvider.Gcp, "firewall rules")]
    public void ApplySystemPromptAddendum_includes_cloud_specific_guidance(
        AgentType agentType,
        CloudProvider cloudProvider,
        string expectedSnippet)
    {
        string result = CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(
            "base prompt",
            agentType,
            cloudProvider);

        result.Should().Contain(expectedSnippet);
        result.Should().StartWith("base prompt");
    }

    [Fact]
    public void ApplySystemPromptAddendum_returns_base_prompt_when_addendum_missing()
    {
        CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(
                "base prompt",
                AgentType.Topology,
                CloudProvider.Azure)
            .Should()
            .Be("base prompt");

        Action blank = () => CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(" ", AgentType.Cost, CloudProvider.Aws);
        blank.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(AgentType.Topology, CloudProvider.Aws, "Lambda")]
    [InlineData(AgentType.Topology, CloudProvider.Gcp, "Cloud Run")]
    [InlineData(AgentType.Compliance, CloudProvider.Aws, "Security Groups")]
    [InlineData(AgentType.Compliance, CloudProvider.Gcp, "FirewallRuleTooPermissive")]
    [InlineData(AgentType.Cost, CloudProvider.Aws, "Savings Plans")]
    [InlineData(AgentType.Cost, CloudProvider.Gcp, "Cloud SQL")]
    [InlineData(AgentType.Critic, CloudProvider.Aws, "public S3 buckets")]
    [InlineData(AgentType.Critic, CloudProvider.Gcp, "public Cloud Storage")]
    public void AppendUserPromptCloudGuidance_appends_guidance_for_aws_and_gcp_targets(
        AgentType agentType,
        CloudProvider cloudProvider,
        string expectedSnippet)
    {
        StringBuilder sb = new("User prompt body");

        CloudProviderAgentPromptComposer.AppendUserPromptCloudGuidance(sb, agentType, cloudProvider);

        string text = sb.ToString();
        text.Should().StartWith("User prompt body");
        text.Should().Contain(expectedSnippet);
        text.Should().Contain("JSON only");
    }

    [Fact]
    public void AppendUserPromptCloudGuidance_skips_azure_and_none_providers()
    {
        StringBuilder azure = new("azure-body");
        CloudProviderAgentPromptComposer.AppendUserPromptCloudGuidance(azure, AgentType.Topology, CloudProvider.Azure);
        azure.ToString().Should().Be("azure-body");

        StringBuilder none = new("neutral-body");
        CloudProviderAgentPromptComposer.AppendUserPromptCloudGuidance(none, AgentType.Cost, CloudProvider.None);
        none.ToString().Should().Be("neutral-body");

        Action nullBuilder = () => CloudProviderAgentPromptComposer.AppendUserPromptCloudGuidance(null!, AgentType.Cost, CloudProvider.Aws);
        nullBuilder.Should().Throw<ArgumentNullException>();
    }
}
