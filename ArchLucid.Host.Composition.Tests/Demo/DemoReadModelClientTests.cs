using ArchLucid.AgentRuntime.Explanation;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Demo;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Provenance;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Demo;

/// <summary>
/// Unit-tests for <see cref="DemoReadModelClient"/>: confirms the demo run resolution strategy (canonical
/// baseline first, then a bounded scan filtered on demo request id + committed manifest), and that a missing
/// run / missing aggregate explanation always degrades to <see langword="null"/> so the controller can return 404.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DemoReadModelClientTests
{
    [Fact]
    public async Task GetLatestCommittedDemoExplainAsync_returns_payload_for_canonical_baseline_when_committed()
    {
        Guid manifestId = Guid.NewGuid();
        RunRecord baseline = new()
        {
            RunId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId,
            ArchitectureRequestId = ContosoRetailDemoIdentifiers.RequestContoso,
            GoldenManifestId = manifestId,
            CurrentManifestVersion = ContosoRetailDemoIdentifiers.ManifestBaseline,
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), ContosoRetailDemoIdentifiers.AuthorityRunBaselineId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(baseline);

        Mock<IRunExplanationSummaryService> explainSvc = new();
        RunExplanationSummary summary = BuildSummary();
        explainSvc
            .Setup(s => s.GetSummaryAsync(It.IsAny<ScopeContext>(), baseline.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(summary);

        Mock<IProvenanceQueryService> provenance = new();
        GraphViewModel graph = new()
        {
            Nodes = [new GraphNodeVm { Id = "n1", Label = "manifest", Type = "Manifest" }],
            Edges = [],
        };
        provenance
            .Setup(p => p.GetFullGraphAsync(It.IsAny<ScopeContext>(), baseline.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(graph);

        DemoReadModelClient sut = BuildSut(runRepo, explainSvc, provenance);

        DemoExplainResponse? response = await sut.GetLatestCommittedDemoExplainAsync();

        response.Should().NotBeNull();
        response!.RunId.Should().Be(baseline.RunId.ToString("N"));
        response.ManifestVersion.Should().Be(ContosoRetailDemoIdentifiers.ManifestBaseline);
        response.IsDemoData.Should().BeTrue();
        response.RunExplanation.Should().BeSameAs(summary);
        response.ProvenanceGraph.Should().BeSameAs(graph);

        runRepo.Verify(
            r => r.ListRecentInScopeAsync(It.IsAny<ScopeContext>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "the canonical baseline path must short-circuit the recent-run scan when it succeeds");
    }

    [Fact]
    public async Task GetLatestCommittedDemoExplainAsync_falls_back_to_recent_demo_run_with_committed_manifest()
    {
        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), ContosoRetailDemoIdentifiers.AuthorityRunBaselineId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        // The most recent committed demo run; explicitly newer than `older`.
        RunRecord newest = new()
        {
            RunId = Guid.NewGuid(),
            ArchitectureRequestId = ContosoRetailDemoIdentifiers.MultiTenantRequestPrefix + "abc",
            GoldenManifestId = Guid.NewGuid(),
            CurrentManifestVersion = "v2",
            CreatedUtc = DateTime.UtcNow.AddMinutes(-5),
        };
        // Older committed demo run that should lose the OrderByDescending(CreatedUtc) tiebreak.
        RunRecord older = new()
        {
            RunId = Guid.NewGuid(),
            ArchitectureRequestId = ContosoRetailDemoIdentifiers.RequestContoso,
            GoldenManifestId = Guid.NewGuid(),
            CurrentManifestVersion = "v1",
            CreatedUtc = DateTime.UtcNow.AddHours(-1),
        };
        // Non-demo committed run — must be ignored even though it is the newest.
        RunRecord nonDemo = new()
        {
            RunId = Guid.NewGuid(),
            ArchitectureRequestId = "request-not-demo",
            GoldenManifestId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };
        // Demo run that has not been committed yet — must also be ignored.
        RunRecord demoUncommitted = new()
        {
            RunId = Guid.NewGuid(),
            ArchitectureRequestId = ContosoRetailDemoIdentifiers.RequestContoso,
            GoldenManifestId = null,
            CreatedUtc = DateTime.UtcNow.AddMinutes(-1),
        };

        runRepo
            .Setup(r => r.ListRecentInScopeAsync(It.IsAny<ScopeContext>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RunRecord> { older, nonDemo, demoUncommitted, newest });

        Mock<IRunExplanationSummaryService> explainSvc = new();
        explainSvc
            .Setup(s => s.GetSummaryAsync(It.IsAny<ScopeContext>(), newest.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildSummary());

        Mock<IProvenanceQueryService> provenance = new();
        provenance
            .Setup(p => p.GetFullGraphAsync(It.IsAny<ScopeContext>(), newest.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GraphViewModel());

        DemoReadModelClient sut = BuildSut(runRepo, explainSvc, provenance);

        DemoExplainResponse? response = await sut.GetLatestCommittedDemoExplainAsync();

        response.Should().NotBeNull();
        response!.RunId.Should().Be(newest.RunId.ToString("N"));
    }

    [Fact]
    public async Task GetLatestCommittedDemoExplainAsync_returns_null_when_no_committed_demo_run_exists()
    {
        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);
        runRepo
            .Setup(r => r.ListRecentInScopeAsync(It.IsAny<ScopeContext>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        DemoReadModelClient sut = BuildSut(runRepo, new Mock<IRunExplanationSummaryService>(), new Mock<IProvenanceQueryService>());

        DemoExplainResponse? response = await sut.GetLatestCommittedDemoExplainAsync();

        response.Should().BeNull();
    }

    [Fact]
    public async Task GetLatestCommittedDemoExplainAsync_returns_null_when_explanation_summary_missing()
    {
        RunRecord baseline = new()
        {
            RunId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId,
            ArchitectureRequestId = ContosoRetailDemoIdentifiers.RequestContoso,
            GoldenManifestId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), baseline.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(baseline);

        Mock<IRunExplanationSummaryService> explainSvc = new();
        explainSvc
            .Setup(s => s.GetSummaryAsync(It.IsAny<ScopeContext>(), baseline.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunExplanationSummary?)null);

        DemoReadModelClient sut = BuildSut(runRepo, explainSvc, new Mock<IProvenanceQueryService>());

        DemoExplainResponse? response = await sut.GetLatestCommittedDemoExplainAsync();

        response.Should().BeNull();
    }

    [Fact]
    public async Task GetLatestCommittedDemoExplainAsync_substitutes_empty_graph_when_provenance_is_null()
    {
        RunRecord baseline = new()
        {
            RunId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId,
            ArchitectureRequestId = ContosoRetailDemoIdentifiers.RequestContoso,
            GoldenManifestId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), baseline.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(baseline);

        Mock<IRunExplanationSummaryService> explainSvc = new();
        explainSvc
            .Setup(s => s.GetSummaryAsync(It.IsAny<ScopeContext>(), baseline.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildSummary());

        Mock<IProvenanceQueryService> provenance = new();
        provenance
            .Setup(p => p.GetFullGraphAsync(It.IsAny<ScopeContext>(), baseline.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GraphViewModel?)null);

        DemoReadModelClient sut = BuildSut(runRepo, explainSvc, provenance);

        DemoExplainResponse? response = await sut.GetLatestCommittedDemoExplainAsync();

        response.Should().NotBeNull();
        response!.ProvenanceGraph.Should().NotBeNull();
        response.ProvenanceGraph.IsEmpty.Should().BeTrue();
    }

    private static DemoReadModelClient BuildSut(
        Mock<IRunRepository> runRepo,
        Mock<IRunExplanationSummaryService> explainSvc,
        Mock<IProvenanceQueryService> provenance) => new(
            runRepo.Object,
            explainSvc.Object,
            provenance.Object,
            TimeProvider.System,
            NullLogger<DemoReadModelClient>.Instance);

    private static RunExplanationSummary BuildSummary() => new()
    {
        Explanation = new ExplanationResult { Summary = "Summary" },
        ThemeSummaries = ["Theme A"],
        OverallAssessment = "Assessment",
        RiskPosture = "Moderate",
    };
}
