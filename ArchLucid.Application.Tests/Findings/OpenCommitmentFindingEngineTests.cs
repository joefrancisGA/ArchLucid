using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Models;
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

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

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
        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().NotBeEmpty();
        findings.Should().OnlyContain(f => !string.IsNullOrWhiteSpace(f.DecisionConsequence));
    }

    private static OpenCommitmentFindingEngine CreateEngine(
        Mock<IFindingReviewTrailRepository> trailRepo,
        Mock<IRiskExceptionService>? riskService = null,
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

        Mock<IFindingInspectReadRepository> inspectRepo = new();

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
