using ArchLucid.Application.ExecDigest;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using static ArchLucid.Application.Tests.Integrations.Itsm.Outbound.ItsmOutboundSealedManifestTestSupport;

namespace ArchLucid.Application.Tests.ExecDigest;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExecDigestComposerTests
{
    [SkippableFact]
    public async Task ComposeAsync_includes_compliance_table_when_service_returns_points()
    {
        Mock<IComplianceDriftTrendService> compliance = new();
        compliance
            .Setup(s => s.GetTrendAsync(
                It.IsAny<Guid>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<TimeSpan>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new ComplianceDriftTrendPoint
                {
                    BucketUtc = new DateTime(2026, 4, 13, 0, 0, 0, DateTimeKind.Utc),
                    ChangeCount = 2,
                    ChangesByType = new Dictionary<string, int>(StringComparer.Ordinal) { ["PackUpdated"] = 2 },
                },
            ]);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(s => s.ListRunsByProjectAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRunDetailQueryService> runDetails = new();
        Mock<IPilotRunDeltaComputer> deltas = new();

        Mock<IGovernanceDigestDecisionNeededComposer> decisionNeeded = new();
        decisionNeeded
            .Setup(x => x.BuildDecisionNeededMarkdownAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        ExecDigestComposer composer = new(
            compliance.Object,
            authority.Object,
            runDetails.Object,
            deltas.Object,
            decisionNeeded.Object,
            CreateManifestHashService(),
            NullLogger<ExecDigestComposer>.Instance);

        Guid tenantId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        DateTime start = new(2026, 4, 13, 0, 0, 0, DateTimeKind.Utc);
        DateTime end = new(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc);
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            ProjectId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
        };

        ExecDigestComposition result = await composer.ComposeAsync(tenantId, start, end, scope, "https://app.example", CancellationToken.None);

        result.ComplianceDriftMarkdown.Should().NotBeNull();
        result.ComplianceDriftMarkdown!.Should().Contain("| Day (UTC) |");
        result.DashboardUrl.Should().StartWith("https://app.example");
    }

    [Fact]
    public async Task ComposeAsync_orders_highlights_by_score_and_builds_findings_delta_without_refetch()
    {
        Guid olderRunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid newerRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        DateTime weekStart = new(2026, 4, 13, 0, 0, 0, DateTimeKind.Utc);
        DateTime weekEnd = new(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc);
        DateTime olderCommitted = new(2026, 4, 14, 12, 0, 0, DateTimeKind.Utc);
        DateTime newerCommitted = new(2026, 4, 16, 12, 0, 0, DateTimeKind.Utc);

        Mock<IComplianceDriftTrendService> compliance = new();
        compliance
            .Setup(s => s.GetTrendAsync(
                It.IsAny<Guid>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<TimeSpan>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(s => s.ListRunsByProjectAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RunSummaryDto
                {
                    RunId = olderRunId,
                    ProjectId = "default",
                    CreatedUtc = olderCommitted,
                    GoldenManifestId = Guid.NewGuid(),
                },
                new RunSummaryDto
                {
                    RunId = newerRunId,
                    ProjectId = "default",
                    CreatedUtc = newerCommitted,
                    GoldenManifestId = Guid.NewGuid(),
                },
            ]);
        authority
            .Setup(s => s.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                olderRunId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new Persistence.Models.RunRecord { RunId = olderRunId },
                GoldenManifest = CreateSealedGoldenManifest(
                    new ScopeContext { TenantId = Guid.Parse("11111111-2222-3333-4444-555555555555") },
                    olderRunId),
            });
        authority
            .Setup(s => s.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                newerRunId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new Persistence.Models.RunRecord { RunId = newerRunId },
                GoldenManifest = CreateSealedGoldenManifest(
                    new ScopeContext { TenantId = Guid.Parse("11111111-2222-3333-4444-555555555555") },
                    newerRunId),
            });

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(s => s.GetRunDetailForRollupAsync(olderRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildCommittedDetail(olderRunId, olderCommitted));
        runDetails
            .Setup(s => s.GetRunDetailForRollupAsync(newerRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildCommittedDetail(newerRunId, newerCommitted));

        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas
            .Setup(d => d.ComputeAsync(It.Is<ArchitectureRunDetail>(detail => detail.Run.RunId == olderRunId.ToString("N")), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PilotRunDeltas
            {
                FindingsBySeverity = [new KeyValuePair<string, int>("Warning", 2)],
            });
        deltas
            .Setup(d => d.ComputeAsync(It.Is<ArchitectureRunDetail>(detail => detail.Run.RunId == newerRunId.ToString("N")), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PilotRunDeltas
            {
                FindingsBySeverity = [new KeyValuePair<string, int>("Error", 5)],
            });

        Mock<IGovernanceDigestDecisionNeededComposer> decisionNeeded = new();
        decisionNeeded
            .Setup(x => x.BuildDecisionNeededMarkdownAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        ExecDigestComposer composer = new(
            compliance.Object,
            authority.Object,
            runDetails.Object,
            deltas.Object,
            decisionNeeded.Object,
            CreateManifestHashService(),
            NullLogger<ExecDigestComposer>.Instance);

        Guid tenantId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            ProjectId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
        };

        ExecDigestComposition result = await composer.ComposeAsync(
            tenantId,
            weekStart,
            weekEnd,
            scope,
            "https://app.example",
            CancellationToken.None);

        result.CommittedManifestsInWeek.Should().Be(2);
        result.TopManifestRuns.Should().HaveCount(2);
        result.TopManifestRuns[0].RunIdHex.Should().Be(newerRunId.ToString("N"));
        result.TopManifestRuns[0].SignificanceScore.Should().Be(5);
        result.TopManifestRuns[1].RunIdHex.Should().Be(olderRunId.ToString("N"));
        result.FindingsDeltaSummary.Should().Contain("2 → 5");
        result.LatestCommittedRunIdHex.Should().Be(newerRunId.ToString("N"));

        // One rollup fetch per candidate — findings delta must not re-fetch earliest/latest.
        runDetails.Verify(
            s => s.GetRunDetailForRollupAsync(olderRunId.ToString("N"), It.IsAny<CancellationToken>()),
            Times.Once);
        runDetails.Verify(
            s => s.GetRunDetailForRollupAsync(newerRunId.ToString("N"), It.IsAny<CancellationToken>()),
            Times.Once);
        deltas.Verify(
            d => d.ComputeAsync(It.IsAny<ArchitectureRunDetail>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    private static ArchitectureRunDetail BuildCommittedDetail(Guid runId, DateTime committedUtc)
    {
        return new ArchitectureRunDetail
        {
            Run = new ArchitectureRun
            {
                RunId = runId.ToString("N"),
                Status = ArchitectureRunStatus.Committed,
                CreatedUtc = committedUtc.AddMinutes(-10),
            },
            Manifest = new GoldenManifest
            {
                RunId = runId.ToString("N"),
                SystemName = "Demo",
                Metadata = new ManifestMetadata
                {
                    ManifestVersion = "v1",
                    CreatedUtc = committedUtc,
                },
                Governance = new ManifestGovernance(),
            },
            Results = [],
            DecisionTraces = [],
        };
    }
}
