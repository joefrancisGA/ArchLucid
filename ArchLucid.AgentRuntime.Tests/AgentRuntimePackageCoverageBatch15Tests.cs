using System.Text;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.AgentRuntime.Prompts.Variants;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch15Tests
{
    [Theory]
    [InlineData(CloudProvider.None, "cloud-neutral topology")]
    [InlineData(CloudProvider.Azure, "MVP-quality Azure topology")]
    public void AgentUserPromptStaticPrefix_topology_emits_provider_specific_guidance(
        CloudProvider cloudProvider,
        string expectedFragment)
    {
        StringBuilder sb = new();

        AgentUserPromptStaticPrefix.AppendTopology(sb, cloudProvider);

        sb.ToString().Should().Contain("Generate a topology AgentResult.");
        sb.ToString().Should().Contain(expectedFragment);
    }

    [Theory]
    [InlineData(CloudProvider.None, "Avoid Azure-, AWS-, or GCP-specific")]
    [InlineData(CloudProvider.Azure, "Managed Identity")]
    public void AgentUserPromptStaticPrefix_compliance_emits_provider_specific_guidance(
        CloudProvider cloudProvider,
        string expectedFragment)
    {
        StringBuilder sb = new();

        AgentUserPromptStaticPrefix.AppendCompliance(sb, cloudProvider);

        sb.ToString().Should().Contain("Generate a compliance AgentResult.");
        sb.ToString().Should().Contain(expectedFragment);
    }

    [Fact]
    public void CloudProviderAgentPromptComposer_appends_aws_topology_guidance()
    {
        StringBuilder sb = new();
        sb.AppendLine("Base prompt");

        CloudProviderAgentPromptComposer.AppendUserPromptCloudGuidance(sb, AgentType.Topology, CloudProvider.Aws);

        string prompt = sb.ToString();

        prompt.Should().Contain("AWS target");
        prompt.Should().Contain("Lambda");
    }

    [Fact]
    public void CloudProviderAgentPromptComposer_appends_gcp_critic_guidance()
    {
        StringBuilder sb = new();

        CloudProviderAgentPromptComposer.AppendUserPromptCloudGuidance(sb, AgentType.Critic, CloudProvider.Gcp);

        sb.ToString().Should().Contain("GCP target");
        sb.ToString().Should().Contain("gcpExtractor");
    }

    [Fact]
    public void CloudProviderAgentPromptComposer_adds_cloud_neutral_system_addendum()
    {
        string composed = CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(
            "System baseline",
            AgentType.Topology,
            CloudProvider.None);

        composed.Should().Contain("System baseline");
        composed.Should().Contain("cloud-neutral");
    }

    [Fact]
    public void CloudProviderAgentPromptComposer_adds_aws_system_addendum_for_cost_agent()
    {
        string composed = CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(
            "Cost baseline",
            AgentType.Cost,
            CloudProvider.Aws);

        composed.Should().Contain("Cost baseline");
        composed.Should().Contain("AWS on-demand");
    }

    [Fact]
    public void FaithfulnessJudgeUserPromptBuilder_formats_trace_evidence_and_agent_json()
    {
        string prompt = FaithfulnessJudgeUserPromptBuilder.Build(
            "trace-42",
            "evidence paragraph",
            """{"findings":[]}""");

        prompt.Should().Contain("traceId:trace-42");
        prompt.Should().Contain("evidence paragraph");
        prompt.Should().Contain("agentJson:");
    }

    [Fact]
    public void FaithfulnessJudgeUserPromptBuilder_rejects_blank_trace_id()
    {
        Action act = () => FaithfulnessJudgeUserPromptBuilder.Build(" ", "evidence", "{}");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void AgentPromptCanonicalHasher_normalizes_newlines_before_hashing()
    {
        string windows = "line-one\r\nline-two\r";
        string unix = "line-one\nline-two\n";

        AgentPromptCanonicalHasher.Sha256HexUtf8Normalized(windows)
            .Should()
            .Be(AgentPromptCanonicalHasher.Sha256HexUtf8Normalized(unix));
        AgentPromptCanonicalHasher.ContentHashPrefix16(unix).Should().HaveLength(16);
    }

    [Fact]
    public void AgentPromptCanonicalHasher_prefix16_handles_short_digest()
    {
        AgentPromptCanonicalHasher.ContentHashPrefix16FromSha256Hex("abc").Should().Be("abc");
        AgentPromptCanonicalHasher.ContentHashPrefix16FromSha256Hex("0123456789abcdef0123456789abcdef")
            .Should()
            .Be("0123456789abcdef");
    }

    [Fact]
    public void PromptVariantBucketHasher_is_deterministic_and_within_range()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        int first = PromptVariantBucketHasher.ComputeBucket(tenantId, runId, "topology-system");
        int second = PromptVariantBucketHasher.ComputeBucket(tenantId, runId, "topology-system");

        first.Should().Be(second);
        first.Should().BeInRange(0, 9999);
    }

    [Fact]
    public void PromptVariantBucketHasher_rejects_blank_template_name()
    {
        Action act = () => PromptVariantBucketHasher.ComputeBucket(Guid.NewGuid(), Guid.NewGuid(), "  ");

        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(AgentType.Topology, "topology-system")]
    [InlineData(AgentType.Critic, "critic-system")]
    [InlineData(AgentType.Cost, "cost-system")]
    [InlineData(AgentType.Compliance, "compliance-system")]
    public void PromptTemplateNameResolver_maps_agent_types(AgentType agentType, string expectedTemplate)
    {
        PromptTemplateNameResolver.FromAgentType(agentType).Should().Be(expectedTemplate);
    }

    [Fact]
    public void TopologySystemPromptTemplate_and_cost_template_expose_non_empty_bodies()
    {
        TopologySystemPromptTemplate.GetText().Should().Contain("Topology Agent");
        CostSystemPromptTemplate.GetText().Should().Contain("Cost Agent");
        ComplianceSystemPromptTemplate.GetText().Should().Contain("Compliance Agent");
        CriticSystemPromptTemplate.GetText().Should().Contain("Critic Agent");
    }
}
