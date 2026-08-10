using System.Security.Cryptography;
using System.Text;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class AgentUserPromptPrefixOrderingTests
{
    private static ArchitectureRequest SampleRequest() =>
        new()
        {
            RequestId = "req-1",
            SystemName = "Claims Intake",
            Environment = "Production",
            CloudProvider = CloudProvider.Azure,
            Description = "Process healthcare claims with PHI controls.",
        };

    private static AgentEvidencePackage SampleEvidence() =>
        new()
        {
            EvidencePackageId = "evidence-1",
            CloudProvider = "Azure",
        };

    private static AgentTask SampleTask(string runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") =>
        new()
        {
            RunId = runId,
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            Objective = "Produce topology",
            AllowedTools = ["manifest"],
            AllowedSources = ["upload"],
        };

    [Fact]
    public void TopologyUserPrompt_places_static_guidance_before_run_header()
    {
        string prompt = AgentUserPromptComposer.BuildTopologyUserPrompt(
            "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            SampleRequest(),
            SampleEvidence(),
            SampleTask(),
            CloudProvider.Azure);

        int guidanceIndex = prompt.IndexOf(AgentUserPromptComposer.ImportantGuidanceMarker, StringComparison.Ordinal);
        int runHeaderIndex = prompt.IndexOf(AgentUserPromptComposer.RunHeaderMarker, StringComparison.Ordinal);
        int architectureIndex = prompt.IndexOf(AgentUserPromptComposer.ArchitectureRequestMarker, StringComparison.Ordinal);

        guidanceIndex.Should().BeGreaterOrEqualTo(0);
        runHeaderIndex.Should().BeGreaterThan(guidanceIndex);
        architectureIndex.Should().BeGreaterThan(runHeaderIndex);
    }

    [Fact]
    public void ComplianceUserPrompt_places_static_guidance_before_run_header()
    {
        AgentTask task = new()
        {
            RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            TaskId = "task-1",
            AgentType = AgentType.Compliance,
            Objective = "Evaluate compliance",
            AllowedTools = ["manifest"],
            AllowedSources = ["upload"],
        };

        string prompt = AgentUserPromptComposer.BuildComplianceUserPrompt(
            "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            SampleRequest(),
            SampleEvidence(),
            task,
            CloudProvider.Azure);

        int guidanceIndex = prompt.IndexOf(AgentUserPromptComposer.ImportantGuidanceMarker, StringComparison.Ordinal);
        int runHeaderIndex = prompt.IndexOf(AgentUserPromptComposer.RunHeaderMarker, StringComparison.Ordinal);

        guidanceIndex.Should().BeGreaterOrEqualTo(0);
        runHeaderIndex.Should().BeGreaterThan(guidanceIndex);
    }

    [Fact]
    public void CostUserPrompt_places_static_guidance_before_retail_grounding()
    {
        ArchitectureRequest request = SampleRequest();
        request.Description = "0123456789 Azure footprint Standard_D2s_v5 in eastus";

        AgentTask task = new()
        {
            RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            TaskId = "task-1",
            AgentType = AgentType.Cost,
            Objective = "Estimate monthly spend",
            AllowedTools = ["manifest"],
            AllowedSources = ["upload"],
        };

        CostRetailGroundingResult grounding = CostRetailGroundingBuilder.Build(
            request,
            SampleEvidence(),
            new CostRetailGroundingLookups(
                new InMemoryAzureRetailPriceStructuredLookup(),
                new InMemoryAwsRetailPriceStructuredLookup(),
                new InMemoryGcpRetailPriceStructuredLookup()));

        string prompt = AgentUserPromptComposer.BuildCostUserPrompt(
            "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            request,
            SampleEvidence(),
            task,
            request.CloudProvider,
            grounding);

        int guidanceIndex = prompt.IndexOf(AgentUserPromptComposer.ImportantGuidanceMarker, StringComparison.Ordinal);
        int retailIndex = prompt.IndexOf("Azure Retail row", StringComparison.Ordinal);

        guidanceIndex.Should().BeGreaterOrEqualTo(0);
        retailIndex.Should().BeGreaterThan(guidanceIndex);
    }

    [Theory]
    [InlineData(AgentType.Topology, nameof(AgentUserPromptComposer.BuildTopologyUserPrompt))]
    [InlineData(AgentType.Compliance, nameof(AgentUserPromptComposer.BuildComplianceUserPrompt))]
    public void UserPrompt_static_prefix_is_byte_stable_across_runs(AgentType agentType, string builderName)
    {
        ArchitectureRequest request = SampleRequest();
        AgentEvidencePackage evidence = SampleEvidence();
        AgentTask task = SampleTask("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        task.AgentType = agentType;

        string first = BuildPrompt(builderName, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", request, evidence, task);
        string second = BuildPrompt(builderName, "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", request, evidence, task);

        string firstPrefix = ExtractStaticPrefix(first);
        string secondPrefix = ExtractStaticPrefix(second);

        SHA256.HashData(Encoding.UTF8.GetBytes(firstPrefix))
            .Should()
            .Equal(SHA256.HashData(Encoding.UTF8.GetBytes(secondPrefix)));
    }

    private static string BuildPrompt(
        string builderName,
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task) =>
        builderName switch
        {
            nameof(AgentUserPromptComposer.BuildTopologyUserPrompt) =>
                AgentUserPromptComposer.BuildTopologyUserPrompt(runId, request, evidence, task, CloudProvider.Azure),
            nameof(AgentUserPromptComposer.BuildComplianceUserPrompt) =>
                AgentUserPromptComposer.BuildComplianceUserPrompt(runId, request, evidence, task, CloudProvider.Azure),
            _ => throw new ArgumentOutOfRangeException(nameof(builderName), builderName, null)
        };

    private static string ExtractStaticPrefix(string prompt)
    {
        int runHeaderIndex = prompt.IndexOf(AgentUserPromptComposer.RunHeaderMarker, StringComparison.Ordinal);

        runHeaderIndex.Should().BeGreaterThan(0);

        return prompt[..runHeaderIndex];
    }
}
