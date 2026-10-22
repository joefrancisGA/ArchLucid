using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services.Findings;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsEngineInvokeStageCrossRunDiffTests
{
    [Fact]
    public async Task ExecuteAsync_skips_cross_run_diff_engines_when_prior_is_absent()
    {
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid() };
        Mock<IFindingEngine> baseline = CreateSuccessfulEngine("requirement", "Requirement", graph);
        Mock<IFindingEngine> requirementDiff = CreateUninvokedEngine(
            "requirement-cross-run-diff",
            "Requirement");
        Mock<IFindingEngine> topologyDiff = CreateUninvokedEngine(
            "topology-cross-run-diff",
            "Topology");

        FindingsEngineInvokeStage stage = new(
            [baseline.Object, requirementDiff.Object, topologyDiff.Object],
            Mock.Of<IFindingPayloadValidator>(MockBehavior.Strict),
            NullLogger<FindingsEngineInvokeStage>.Instance);

        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = graph,
            AnalysisContext = new FindingAnalysisContext(),
        };

        await stage.ExecuteAsync(context, CancellationToken.None);

        context.EngineFailures.Should().BeEmpty();
        context.SuccessfulEngineTypes.Should().Equal("requirement");
        VerifyNeverAnalyzed(requirementDiff);
        VerifyNeverAnalyzed(topologyDiff);
    }

    [Fact]
    public async Task ExecuteAsync_invokes_cross_run_diff_engines_when_prior_is_bound()
    {
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid() };
        Mock<IFindingEngine> baseline = CreateSuccessfulEngine("requirement", "Requirement", graph);
        Mock<IFindingEngine> requirementDiff = CreateSuccessfulEngine(
            "requirement-cross-run-diff",
            "Requirement",
            graph);
        Mock<IFindingEngine> topologyDiff = CreateSuccessfulEngine(
            "topology-cross-run-diff",
            "Topology",
            graph);

        FindingsEngineInvokeStage stage = new(
            [baseline.Object, requirementDiff.Object, topologyDiff.Object],
            Mock.Of<IFindingPayloadValidator>(MockBehavior.Strict),
            NullLogger<FindingsEngineInvokeStage>.Instance);

        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = graph,
            AnalysisContext = new FindingAnalysisContext
            {
                Prior = new PriorReviewSnapshots { PriorRunId = Guid.NewGuid() },
            },
        };

        await stage.ExecuteAsync(context, CancellationToken.None);

        context.EngineFailures.Should().BeEmpty();
        context.SuccessfulEngineTypes.Should().BeEquivalentTo(
            ["requirement", "requirement-cross-run-diff", "topology-cross-run-diff"]);
        VerifyAnalyzedOnce(requirementDiff);
        VerifyAnalyzedOnce(topologyDiff);
    }

    private static Mock<IFindingEngine> CreateSuccessfulEngine(
        string engineType,
        string category,
        GraphSnapshot graph)
    {
        Mock<IFindingEngine> engine = new(MockBehavior.Strict);
        engine.Setup(x => x.EngineType).Returns(engineType);
        engine.Setup(x => x.Category).Returns(category);
        engine.Setup(x => x.AnalyzeAsync(graph, It.IsAny<FindingAnalysisContext?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<Finding>());

        return engine;
    }

    private static Mock<IFindingEngine> CreateUninvokedEngine(string engineType, string category)
    {
        Mock<IFindingEngine> engine = new(MockBehavior.Strict);
        engine.Setup(x => x.EngineType).Returns(engineType);
        engine.Setup(x => x.Category).Returns(category);

        return engine;
    }

    private static void VerifyNeverAnalyzed(Mock<IFindingEngine> engine)
    {
        engine.Verify(
            x => x.AnalyzeAsync(
                It.IsAny<GraphSnapshot>(),
                It.IsAny<FindingAnalysisContext?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static void VerifyAnalyzedOnce(Mock<IFindingEngine> engine)
    {
        engine.Verify(
            x => x.AnalyzeAsync(
                It.IsAny<GraphSnapshot>(),
                It.IsAny<FindingAnalysisContext?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
