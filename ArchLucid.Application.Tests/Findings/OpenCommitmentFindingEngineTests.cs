using System.Text.Json;

using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Application")]
public sealed class OpenCommitmentFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_when_disabled_returns_empty()
    {
        Mock<IFindingReviewTrailRepository> trailRepo = new();
        OpenCommitmentFindingEngine engine = CreateEngine(
            trailRepo,
            enabled: false);

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(new GraphSnapshot(), null, CancellationToken.None);

        findings.Should().BeEmpty();
        trailRepo.Verify(
            r => r.ListSinceUtcAsync(It.IsAny<Guid>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_findings_from_trail_signals()
    {
        DateTimeOffset now = new(2026, 8, 26, 12, 0, 0, TimeSpan.Zero);
        Mock<IFindingReviewTrailRepository> trailRepo = new();
        trailRepo
            .Setup(r => r.ListSinceUtcAsync(It.IsAny<Guid>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new FindingReviewEventRecord
                {
                    FindingId = "f-defer",
                    Disposition = FindingDisposition.Deferred,
                    RevisitDueUtc = now.AddDays(-2),
                    OccurredAtUtc = now.AddDays(-10),
                },
            ]);

        OpenCommitmentFindingEngine engine = CreateEngine(trailRepo, now: now);
        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(new GraphSnapshot(), null, CancellationToken.None);

        findings.Should().NotBeEmpty();
        findings.Should().OnlyContain(f => !string.IsNullOrWhiteSpace(f.DecisionConsequence));
    }

    [Fact]
    public async Task AnalyzeAsync_deferred_public_access_commitment_sets_still_open_when_graph_matches()
    {
        DateTimeOffset now = new(2026, 8, 26, 12, 0, 0, TimeSpan.Zero);
        Mock<IFindingReviewTrailRepository> trailRepo = new();
        trailRepo
            .Setup(r => r.ListSinceUtcAsync(It.IsAny<Guid>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new FindingReviewEventRecord
                {
                    FindingId = "f-public-defer",
                    Disposition = FindingDisposition.Deferred,
                    RevisitDueUtc = now.AddDays(-1),
                    OccurredAtUtc = now.AddDays(-14),
                },
            ]);

        Mock<IFindingInspectReadRepository> inspectRepo = new();
        inspectRepo
            .Setup(r => r.GetInspectAsync(
                It.IsAny<ScopeContext>(),
                "f-public-defer",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = "f-public-defer",
                TypedPayload = JsonSerializer.SerializeToElement(new
                {
                    title = "Deferred public network access on stpayprod",
                    rationale = "Temporary exception for migration.",
                }),
            });

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "topo-stpayprod",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "stpayprod",
                    SourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod",
                    Properties = new Dictionary<string, string>
                    {
                        ["publicNetworkAccess"] = "Enabled",
                    },
                },
            ],
        };

        OpenCommitmentFindingEngine engine = CreateEngine(trailRepo, inspectRepo: inspectRepo, now: now);
        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        OpenCommitmentFindingPayload payload = finding.Payload.Should().BeOfType<OpenCommitmentFindingPayload>().Subject;
        payload.TopologyMatch.Should().BeTrue();
        payload.StillOpenOnCurrentGraph.Should().BeTrue();
        payload.MatchedTopologyNodeId.Should().Be("topo-stpayprod");
        finding.RelatedNodeIds.Should().ContainSingle("topo-stpayprod");
        finding.Trace!.Notes.Should().Contain("evidence:graph-node:topo-stpayprod");
        finding.Severity.Should().Be(FindingSeverity.Warning);
    }

    [Fact]
    public async Task AnalyzeAsync_unmatched_commitment_emits_without_fake_node_ids()
    {
        DateTimeOffset now = new(2026, 8, 26, 12, 0, 0, TimeSpan.Zero);
        Mock<IFindingReviewTrailRepository> trailRepo = new();
        trailRepo
            .Setup(r => r.ListSinceUtcAsync(It.IsAny<Guid>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new FindingReviewEventRecord
                {
                    FindingId = "f-generic",
                    Disposition = FindingDisposition.Deferred,
                    RevisitDueUtc = now.AddDays(-1),
                    OccurredAtUtc = now.AddDays(-14),
                },
            ]);

        Mock<IFindingInspectReadRepository> inspectRepo = new();
        inspectRepo
            .Setup(r => r.GetInspectAsync(
                It.IsAny<ScopeContext>(),
                "f-generic",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = "f-generic",
                TypedPayload = JsonSerializer.SerializeToElement(new
                {
                    title = "Deferred governance follow-up",
                    rationale = "No topology anchor in this commitment.",
                }),
            });

        OpenCommitmentFindingEngine engine = CreateEngine(trailRepo, inspectRepo: inspectRepo, now: now);
        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(new GraphSnapshot(), null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        OpenCommitmentFindingPayload payload = finding.Payload.Should().BeOfType<OpenCommitmentFindingPayload>().Subject;
        payload.TopologyMatch.Should().BeFalse();
        payload.StillOpenOnCurrentGraph.Should().BeFalse();
        payload.MatchedTopologyNodeId.Should().BeNull();
        finding.RelatedNodeIds.Should().BeEmpty();
        finding.Trace!.Notes.Should().NotContain(note => note.StartsWith("evidence:graph-node:", StringComparison.Ordinal));
    }

    private static OpenCommitmentFindingEngine CreateEngine(
        Mock<IFindingReviewTrailRepository> trailRepo,
        Mock<IRiskExceptionService>? riskService = null,
        Mock<IFindingInspectReadRepository>? inspectRepo = null,
        DateTimeOffset? now = null,
        bool enabled = true)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        });

        riskService ??= new Mock<IRiskExceptionService>();
        riskService
            .Setup(s => s.ListActiveAsync(It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        inspectRepo ??= new Mock<IFindingInspectReadRepository>();

        FakeTimeProvider clock = new();
        clock.SetUtcNow(now ?? new DateTimeOffset(2026, 8, 26, 12, 0, 0, TimeSpan.Zero));

        OpenCommitmentFindingOptions options = new() { Enabled = enabled };

        return new OpenCommitmentFindingEngine(
            scopeProvider.Object,
            trailRepo.Object,
            riskService.Object,
            inspectRepo.Object,
            clock,
            Options.Create(options));
    }
}
