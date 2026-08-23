using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Suite", "Core")]
public sealed class ReviewRunEngineProvenanceAggregatorTests
{
    [Fact]
    public void Aggregate_simulator_traces_produce_deterministic_provider_kind()
    {
        RunRecord run = BuildRun(StructuralExecutionMode.Simulator);
        AgentEvidencePackage evidence = BuildEvidence();
        List<AgentExecutionTrace> traces =
        [
            BuildTrace(AgentExecutionTraceModelMetadata.SimulatorDeploymentName, promptReleaseLabel: "architecture-review-v0.4"),
        ];

        ReviewRunEngineProvenance provenance = ReviewRunEngineProvenanceAggregator.Aggregate(
            traces,
            evidence,
            run,
            new FindingsSnapshot { SchemaVersion = FindingsSchema.CurrentSnapshotVersion },
            CreateCostEstimator());

        provenance.ProviderKind.Should().Be("deterministic");
        provenance.DeploymentOrModelId.Should().Be(AgentExecutionTraceModelMetadata.SimulatorDeploymentName);
        provenance.PromptPackVersion.Should().Be("architecture-review-v0.4");
        provenance.PolicyPackVersion.Should().Be("Healthcare Claims");
        provenance.OutputSchemaVersion.Should().Be("FindingsSnapshot v3");
        provenance.EngineProfileId.Should().Be("deterministic-simulator");
    }

    [Fact]
    public void Aggregate_reasoning_only_traces_include_reasoning_tokens_in_output_total()
    {
        RunRecord run = BuildRun(StructuralExecutionMode.Real);
        AgentEvidencePackage evidence = BuildEvidence(includePolicies: false);
        List<AgentExecutionTrace> traces =
        [
            BuildTrace("o1-preview", reasoningTokens: 300),
        ];

        ReviewRunEngineProvenance provenance = ReviewRunEngineProvenanceAggregator.Aggregate(
            traces,
            evidence,
            run,
            findingsSnapshot: null,
            CreateCostEstimator());

        provenance.TotalInputTokens.Should().BeNull();
        provenance.TotalOutputTokens.Should().Be(300);
        provenance.EstimatedCostUsd.Should().NotBeNull();
    }

    [Fact]
    public void Aggregate_azure_traces_produce_azure_openai_provider_kind_and_token_totals()
    {
        RunRecord run = BuildRun(StructuralExecutionMode.Real);
        AgentEvidencePackage evidence = BuildEvidence(includePolicies: false);
        List<AgentExecutionTrace> traces =
        [
            BuildTrace("gpt-4o-arch", inputTokens: 100, outputTokens: 40),
            BuildTrace("gpt-4o-arch", inputTokens: 50, outputTokens: 10),
        ];

        ReviewRunEngineProvenance provenance = ReviewRunEngineProvenanceAggregator.Aggregate(
            traces,
            evidence,
            run,
            findingsSnapshot: null,
            CreateCostEstimator());

        provenance.ProviderKind.Should().Be("azure-openai");
        provenance.DeploymentOrModelId.Should().Be("gpt-4o-arch");
        provenance.TotalInputTokens.Should().Be(150);
        provenance.TotalOutputTokens.Should().Be(50);
        provenance.EstimatedCostUsd.Should().Be(0.0025m);
        provenance.PolicyPackVersion.Should().BeNull();
    }

    private static RunRecord BuildRun(StructuralExecutionMode mode)
    {
        return new RunRecord
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            CreatedUtc = new DateTime(2026, 6, 16, 12, 0, 0, DateTimeKind.Utc),
            ContextSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            StructuralExecutionMode = mode,
        };
    }

    private static AgentEvidencePackage BuildEvidence(bool includePolicies = true)
    {
        AgentEvidencePackage evidence = new()
        {
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RequestId = "req-1",
        };

        if (includePolicies)
        {
            evidence.Policies.Add(new PolicyEvidence
            {
                PolicyId = "healthcare-claims",
                Title = "Healthcare Claims",
            });
        }

        return evidence;
    }

    private static AgentExecutionTrace BuildTrace(
        string deploymentName,
        string? promptReleaseLabel = null,
        int? inputTokens = null,
        int? outputTokens = null,
        int? reasoningTokens = null)
    {
        return new AgentExecutionTrace
        {
            ModelDeploymentName = deploymentName,
            PromptReleaseLabel = promptReleaseLabel,
            InputTokenCount = inputTokens,
            OutputTokenCount = outputTokens,
            ReasoningTokenCount = reasoningTokens,
        };
    }

    private static ILlmCostEstimator CreateCostEstimator()
    {
        Mock<ILlmCostEstimator> estimator = new();
        estimator
            .Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .Returns<int, int, int, string?, string?>((input, output, reasoning, _, _) =>
                input * 0.00001m + output * 0.00002m + reasoning * 0.00003m);

        return estimator.Object;
    }
}
