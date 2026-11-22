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
