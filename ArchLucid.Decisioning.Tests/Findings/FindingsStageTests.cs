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
public sealed class FindingsPolicyStampStageTests
{
    [Fact]
    public async Task ExecuteAsync_without_scope_provider_is_noop()
    {
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid() };
        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = graph,
        };

        FindingsPolicyStampStage stage = new();
        await stage.ExecuteAsync(context, CancellationToken.None);

        graph.Nodes.Should().BeEmpty();
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsEngineInvokeStageTests
{
    [Fact]
    public async Task ExecuteAsync_all_engines_fail_throws_aggregate_exception()
    {
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid() };
        Mock<IFindingEngine> engine = new(MockBehavior.Strict);
        engine.Setup(x => x.EngineType).Returns("bad");
        engine.Setup(x => x.Category).Returns("Security");
        engine.Setup(x => x.AnalyzeAsync(graph, null, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        Mock<IFindingPayloadValidator> validator = new(MockBehavior.Strict);
        FindingsEngineInvokeStage stage = new(
            [engine.Object],
            validator.Object,
            NullLogger<FindingsEngineInvokeStage>.Instance);

        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = graph,
        };

        await Assert.ThrowsAsync<AggregateException>(() => stage.ExecuteAsync(context, CancellationToken.None));
    }
    [Theory]
    [InlineData("azure-inventory-security-baseline", HeldCheckInputCode.AzureInventoryZip)]
    [InlineData("aws-inventory-security-baseline", HeldCheckInputCode.AwsInventoryZip)]
    [InlineData("gcp-inventory-security-baseline", HeldCheckInputCode.GcpInventoryZip)]
    public async Task ExecuteAsync_with_no_committed_inventory_marks_security_baseline_not_assessed(
        string engineType,
        HeldCheckInputCode inputCode)
    {
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid() };
        HeldCheckLedger heldChecks = new();
        FindingAnalysisContext analysis = new()
        {
            HasCreateTimeEvidencePinCommitment = true,
            HeldCheckLedger = heldChecks,
        };
        Mock<IEffectfulFindingEngine> engine = new(MockBehavior.Strict);
        engine.SetupGet(x => x.EngineType).Returns(engineType);
        engine.SetupGet(x => x.Category).Returns("Security");

        FindingsEngineInvokeStage stage = new(
            Array.Empty<IFindingEngine>(),
            Mock.Of<IFindingPayloadValidator>(),
            NullLogger<FindingsEngineInvokeStage>.Instance,
            effectfulEngines: [engine.Object]);
        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = graph,
            AnalysisContext = analysis,
        };

        await stage.ExecuteAsync(context, CancellationToken.None);

        engine.Verify(
            x => x.AnalyzeAsync(
                It.IsAny<GraphSnapshot>(),
                It.IsAny<FindingAnalysisContext?>(),
                It.IsAny<CancellationToken>()),
            Times.Never());
        context.SuccessfulEngineTypes.Should().NotContain(engineType);
        context.EngineFailures.Should().BeEmpty();
        HeldCheckLedgerRollupEntry held = heldChecks.BuildRollup().Should().ContainSingle().Subject;
        held.InputCode.Should().Be(inputCode);
        held.EngineTypes.Should().ContainSingle().Which.Should().Be(engineType);
    }

    [Fact]
    public async Task ExecuteAsync_keeps_required_unpinned_security_engine_fail_closed()
    {
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid() };
        HeldCheckLedger heldChecks = new();
        FindingAnalysisContext analysis = new()
        {
            HasCreateTimeEvidencePinCommitment = true,
            RequiredEngineTypes = ["azure-inventory-security-baseline"],
            HeldCheckLedger = heldChecks,
        };
        Mock<IEffectfulFindingEngine> engine = new(MockBehavior.Strict);
        engine.SetupGet(x => x.EngineType).Returns("azure-inventory-security-baseline");
        engine.SetupGet(x => x.Category).Returns("Security");
        engine.Setup(x => x.AnalyzeAsync(graph, analysis, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Required inventory pin missing."));

        FindingsEngineInvokeStage stage = new(
            Array.Empty<IFindingEngine>(),
            Mock.Of<IFindingPayloadValidator>(),
            NullLogger<FindingsEngineInvokeStage>.Instance,
            effectfulEngines: [engine.Object]);
        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = graph,
            AnalysisContext = analysis,
        };

        await Assert.ThrowsAsync<AggregateException>(
            () => stage.ExecuteAsync(context, CancellationToken.None));
        context.EngineFailures.Should().ContainSingle().Which.EngineType
            .Should().Be("azure-inventory-security-baseline");
        heldChecks.BuildRollup().Should().BeEmpty();
    }

    [Fact]
    public async Task ExecuteAsync_does_not_skip_pinned_security_engine_with_missing_collection_utc()
    {
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid() };
        FindingAnalysisContext analysis = new()
        {
            HasCreateTimeEvidencePinCommitment = true,
            EvidencePins =
            [
                new EvidencePackagePin
                {
                    Provider = "aws-extractor",
                    PackageId = Guid.NewGuid(),
                    CollectionUtc = null,
                },
            ],
        };
        Mock<IEffectfulFindingEngine> engine = new(MockBehavior.Strict);
        engine.SetupGet(x => x.EngineType).Returns("aws-inventory-security-baseline");
        engine.SetupGet(x => x.Category).Returns("Security");
        engine.Setup(x => x.AnalyzeAsync(graph, analysis, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Pinned CollectionUtc missing."));

        FindingsEngineInvokeStage stage = new(
            Array.Empty<IFindingEngine>(),
            Mock.Of<IFindingPayloadValidator>(),
            NullLogger<FindingsEngineInvokeStage>.Instance,
            effectfulEngines: [engine.Object]);
        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = graph,
            AnalysisContext = analysis,
        };

        await Assert.ThrowsAsync<AggregateException>(
            () => stage.ExecuteAsync(context, CancellationToken.None));
        context.EngineFailures.Should().ContainSingle().Which.EngineType
            .Should().Be("aws-inventory-security-baseline");
    }

    [Fact]
    public async Task ExecuteAsync_does_not_suppress_missing_evidence_without_verified_commitment()
    {
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid() };
        FindingAnalysisContext analysis = new();
        Mock<IEffectfulFindingEngine> engine = new(MockBehavior.Strict);
        engine.SetupGet(x => x.EngineType).Returns("azure-inventory-security-baseline");
        engine.SetupGet(x => x.Category).Returns("Security");
        engine.Setup(x => x.AnalyzeAsync(graph, analysis, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Unverified evidence commitment."));

        FindingsEngineInvokeStage stage = new(
            Array.Empty<IFindingEngine>(),
            Mock.Of<IFindingPayloadValidator>(),
            NullLogger<FindingsEngineInvokeStage>.Instance,
            effectfulEngines: [engine.Object]);
        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = graph,
            AnalysisContext = analysis,
        };

        await Assert.ThrowsAsync<AggregateException>(
            () => stage.ExecuteAsync(context, CancellationToken.None));
        context.EngineFailures.Should().ContainSingle().Which.EngineType
            .Should().Be("azure-inventory-security-baseline");
    }

}

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

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsSnapshotEmitStageTests
{
    [Fact]
    public async Task ExecuteAsync_sets_generation_status_complete_when_no_failures()
    {
        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = new GraphSnapshot { GraphSnapshotId = Guid.NewGuid() },
        };
        context.Snapshot = new FindingsSnapshot
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = context.RunId,
            ContextSnapshotId = context.ContextSnapshotId,
            GraphSnapshotId = context.GraphSnapshot.GraphSnapshotId,
            CreatedUtc = DateTime.UtcNow,
            Findings = [],
            EngineFailures = [],
            SchemaVersion = 1,
        };

        FindingsSnapshotEmitStage stage = new(NullLogger<FindingsSnapshotEmitStage>.Instance);
        FindingsSnapshot result = await stage.ExecuteAsync(context, CancellationToken.None);

        result.GenerationStatus.Should().Be(FindingsSnapshotGenerationStatus.Complete);
    }
}
