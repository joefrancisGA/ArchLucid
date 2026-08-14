using System.Text;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.GoldenCorpus;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Prompts;

[Trait("Category", "Unit")]
public sealed class AgentUserPromptCloudTargetTests
{
    private static AgentTask SampleTask(AgentType agentType) =>
        new()
        {
            RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            TaskId = "task-1",
            AgentType = agentType,
            Objective = "Evaluate architecture",
            AllowedTools = ["manifest"],
            AllowedSources = ["upload"],
        };

    private static AgentEvidencePackage SampleEvidence() =>
        new()
        {
            EvidencePackageId = "evidence-1",
            CloudProvider = "Aws",
        };

    [Theory]
    [InlineData(AgentType.Topology, CloudProvider.Aws, "EC2", "App Service")]
    [InlineData(AgentType.Topology, CloudProvider.Gcp, "GKE", "App Service")]
    [InlineData(AgentType.Compliance, CloudProvider.Aws, "IAM roles/policies", "Key Vault")]
    [InlineData(AgentType.Compliance, CloudProvider.Gcp, "IAM bindings", "Managed Identity")]
    [InlineData(AgentType.Cost, CloudProvider.Aws, "Savings Plans", "Azure Retail row")]
    [InlineData(AgentType.Cost, CloudProvider.Gcp, "GCE/GKE/Cloud SQL", "Azure Retail row")]
    [InlineData(AgentType.Critic, CloudProvider.Aws, "public S3 buckets", "azurerm_")]
    [InlineData(AgentType.Critic, CloudProvider.Gcp, "0.0.0.0/0 firewall", "azurerm_")]
    public void SystemPromptAddendum_selects_target_cloud_guidance(
        AgentType agentType,
        CloudProvider cloudProvider,
        string expectedPhrase,
        string forbiddenPhrase)
    {
        string result = CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(
            "base prompt",
            agentType,
            cloudProvider);

        result.Should().Contain(expectedPhrase);
        result.Should().NotContain(forbiddenPhrase);
    }

    [Fact]
    public void ComplianceUserPrompt_aws_uses_iam_guidance_not_key_vault()
    {
        ArchitectureRequest request = GoldenCohortMultiCloudArchitectureRequestFactory.BuildAwsWebWorkload("001");

        string prompt = AgentUserPromptComposer.BuildComplianceUserPrompt(
            "run-1",
            request,
            SampleEvidence(),
            SampleTask(AgentType.Compliance),
            CloudProvider.Aws);

        prompt.Should().Contain("IAM roles/policies");
        prompt.Should().NotContain("Key Vault");
        prompt.Should().NotContain("Managed Identity");
    }

    [Fact]
    public void CostUserPrompt_gcp_uses_gcp_spend_guidance_not_azure_retail()
    {
        ArchitectureRequest request = GoldenCohortMultiCloudArchitectureRequestFactory.BuildGcpApiPlatform("001");
        CostRetailGroundingResult grounding = CostRetailGroundingBuilder.Build(
            request,
            SampleEvidence(),
            new CostRetailGroundingLookups(
                new InMemoryAzureRetailPriceStructuredLookup(),
                new InMemoryAwsRetailPriceStructuredLookup(),
                new InMemoryGcpRetailPriceStructuredLookup()),
            CloudProvider.Gcp);

        string prompt = AgentUserPromptComposer.BuildCostUserPrompt(
            "run-1",
            request,
            SampleEvidence(),
            SampleTask(AgentType.Cost),
            CloudProvider.Gcp,
            grounding);

        prompt.Should().Contain("GCE/GKE/Cloud SQL");
        prompt.Should().NotContain("Azure Retail Prices");
    }

    [Fact]
    public void CriticUserPrompt_aws_uses_aws_extractor_evidence_contract()
    {
        ArchitectureRequest request = GoldenCohortMultiCloudArchitectureRequestFactory.BuildAwsServerlessIngestion("002");

        string prompt = AgentUserPromptComposer.BuildCriticUserPrompt(
            "run-1",
            request,
            SampleEvidence(),
            SampleTask(AgentType.Critic),
            CloudProvider.Aws);

        prompt.Should().Contain("awsExtractor:");
        prompt.Should().NotContain("azureExtractor:");
    }

    [Fact]
    public void TopologyUserPrompt_gcp_uses_gke_guidance()
    {
        ArchitectureRequest request = GoldenCohortMultiCloudArchitectureRequestFactory.BuildGcpComputeLift("002");

        string prompt = AgentUserPromptComposer.BuildTopologyUserPrompt(
            "run-1",
            request,
            SampleEvidence(),
            SampleTask(AgentType.Topology),
            CloudProvider.Gcp);

        prompt.Should().Contain("GKE Autopilot");
        prompt.Should().NotContain("App Service");
    }

    [Theory]
    [InlineData(AgentType.Topology, CloudProvider.Aws, "Important guidance (AWS target):", "Lambda")]
    [InlineData(AgentType.Topology, CloudProvider.Gcp, "Important guidance (GCP target):", "GKE Autopilot")]
    [InlineData(AgentType.Compliance, CloudProvider.Aws, "Important guidance (AWS target):", "IAM roles/policies")]
    [InlineData(AgentType.Cost, CloudProvider.Gcp, "Important guidance (GCP target):", "GCE/GKE/Cloud SQL")]
    [InlineData(AgentType.Critic, CloudProvider.Aws, "Important guidance (AWS target):", "awsExtractor:")]
    public void StaticPrefix_aws_gcp_contains_provider_specific_important_guidance(
        AgentType agentType,
        CloudProvider cloudProvider,
        string expectedHeader,
        string expectedPhrase)
    {
        StringBuilder sb = new();

        switch (agentType)
        {
            case AgentType.Topology:
                AgentUserPromptStaticPrefix.AppendTopology(sb, cloudProvider);
                break;
            case AgentType.Compliance:
                AgentUserPromptStaticPrefix.AppendCompliance(sb, cloudProvider);
                break;
            case AgentType.Cost:
                AgentUserPromptStaticPrefix.AppendCost(sb, cloudProvider);
                break;
            case AgentType.Critic:
                AgentUserPromptStaticPrefix.AppendCritic(sb, cloudProvider);
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(agentType), agentType, null);
        }

        string prompt = sb.ToString();

        prompt.Should().Contain(expectedHeader);
        prompt.Should().Contain(expectedPhrase);
    }
}
