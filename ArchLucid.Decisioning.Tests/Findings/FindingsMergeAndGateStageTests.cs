using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Services.Findings;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsMergeAndGateStageTests
{
    [Fact]
    public async Task ExecuteAsync_builds_snapshot_with_deduped_findings()
    {
        Finding finding = new()
        {
            FindingId = "f1",
            FindingType = "T",
            Category = "Security",
            EngineType = "e1",
            Title = "title",
            Rationale = "r",
            Severity = FindingSeverity.Info,
        };

        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = new GraphSnapshot { GraphSnapshotId = Guid.NewGuid() },
        };
        context.AllFindings.Add(finding);
        context.SuccessfulEngineInvocations = 1;
        context.SuccessfulEngineTypes.Add("e1");

        FindingsMergeAndGateStage stage = new(
            Options.Create(new HumanReviewFindingOptions()),
            Options.Create(new InsightDensityGateOptions()),
            new FindingProvenanceValidator(),
            Options.Create(new FindingSemanticSupportBandOptions()),
            NoOpFindingSemanticSupportBandLlmJudge.Instance);

        await stage.ExecuteAsync(context, CancellationToken.None);

        context.Snapshot.Should().NotBeNull();
        context.Snapshot!.Findings.Should().ContainSingle();
        context.DedupedFindingsCount.Should().Be(1);
    }

    [Fact]
    public async Task ExecuteAsync_adds_engine_failure_when_required_engine_type_did_not_succeed()
    {
        FindingAnalysisContext analysisContext = new()
        {
            RequiredEngineTypes = ["security-baseline", "declaration-security-baseline"],
        };

        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = new GraphSnapshot { GraphSnapshotId = Guid.NewGuid() },
            AnalysisContext = analysisContext,
        };
        context.SuccessfulEngineTypes.Add("topology-structure");

        FindingsMergeAndGateStage stage = new(
            Options.Create(new HumanReviewFindingOptions()),
            Options.Create(new InsightDensityGateOptions()),
            new FindingProvenanceValidator(),
            Options.Create(new FindingSemanticSupportBandOptions()),
            NoOpFindingSemanticSupportBandLlmJudge.Instance);

        await stage.ExecuteAsync(context, CancellationToken.None);

        context.Snapshot.Should().NotBeNull();
        context.Snapshot!.EngineFailures.Should().HaveCount(2);
        context.Snapshot.EngineFailures.Should().OnlyContain(failure => failure.EngineType == "policy-pack-coverage");
        context.Snapshot.EngineFailures.Select(failure => failure.ErrorMessage)
            .Should()
            .Contain(message => message.Contains("security-baseline", StringComparison.Ordinal))
            .And.Contain(message => message.Contains("declaration-security-baseline", StringComparison.Ordinal));
    }

    [Fact]
    public async Task ExecuteAsync_scores_semantic_support_band_for_decision_grade_with_citations()
    {
        const string nsgArmId =
            "/subscriptions/00000000-0000-4000-8000-000000000001/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/edge-nsg";

        Finding finding = new()
        {
            FindingId = "f-unsupported",
            FindingType = "IdentityBlastRadiusFinding",
            Category = "Security",
            EngineType = "identity-blast-radius",
            Title = "Machine actor reaches sensitive datastore",
            Rationale =
                "PostgreSQL firewall rules allow unrestricted storage account access from the public internet.",
            Severity = FindingSeverity.Error,
            Classification = FindingClassification.DecisionGradeFinding,
            RelatedNodeIds = ["sql-pay-prod"],
            EvidenceRefs = [nsgArmId],
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["identity-blast-radius"],
                Notes = ["evidence:graph-node:sql-pay-prod"],
            },
        };

        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = new GraphSnapshot { GraphSnapshotId = Guid.NewGuid() },
        };
        context.AllFindings.Add(finding);
        context.SuccessfulEngineInvocations = 1;
        context.SuccessfulEngineTypes.Add("identity-blast-radius");

        FindingsMergeAndGateStage stage = new(
            Options.Create(new HumanReviewFindingOptions()),
            Options.Create(new InsightDensityGateOptions()),
            new FindingProvenanceValidator(),
            Options.Create(new FindingSemanticSupportBandOptions()),
            NoOpFindingSemanticSupportBandLlmJudge.Instance);

        await stage.ExecuteAsync(context, CancellationToken.None);

        Finding emitted = context.Snapshot!.Findings.Should().ContainSingle().Subject;
        emitted.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        emitted.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Unsupported);
    }
}
