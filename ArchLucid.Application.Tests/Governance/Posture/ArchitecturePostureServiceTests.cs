using ArchLucid.Application.Governance.Posture;
using ArchLucid.Application.Tests.Governance;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance.Posture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Governance.Posture;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance.Posture;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitecturePostureServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000000");

    [Fact]
    public async Task GetSummaryAsync_returns_all_seven_catalog_pillars()
    {
        Mock<IArchitecturePostureReader> reader = new();
        reader.Setup(r => r.ReadAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitecturePostureReadModel());

        ArchitecturePostureService sut = CreateSut(reader.Object);

        ArchitecturePostureSummary summary = await sut.GetSummaryAsync(
            TenantId,
            WorkspaceId,
            ProjectId,
            cancellationToken: CancellationToken.None);

        summary.Pillars.Should().HaveCount(ArchitecturePillarCatalog.All.Count);
        summary.Pillars.Select(pillar => pillar.PillarKey)
            .Should()
            .Equal(ArchitecturePillarCatalog.All.Select(entry => entry.PillarKey));
    }

    [Fact]
    public async Task GetSummaryAsync_maps_aggregates_and_resolves_examination_state()
    {
        DateTimeOffset snapshotUtc = new(2026, 4, 1, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset assignedUtc = new(2026, 3, 1, 0, 0, 0, TimeSpan.Zero);

        ArchitecturePostureReadModel readModel = new()
        {
            PillarAggregates =
            [
                new PillarFindingAggregate
                {
                    PillarKey = nameof(ArchitecturePillar.Security),
                    CriticalCount = 2,
                    ErrorCount = 1,
                },
            ],
            PackAssignments =
            [
                new PillarPackAssignment
                {
                    PillarKey = nameof(ArchitecturePillar.Security),
                    PolicyPackId = Guid.NewGuid(),
                    PolicyPackName = "Security baseline",
                    PolicyPackVersion = "1.0.0",
                    ScopeLevel = "Project",
                    IsEnabled = true,
                    AssignedUtc = assignedUtc,
                },
            ],
            ReviewIntegrity = new ReviewIntegrityAggregate { WarningCount = 4 },
            UncategorizedCount = 0,
            LatestSnapshotCreatedUtc = snapshotUtc,
        };

        Mock<IArchitecturePostureReader> reader = new();
        reader.Setup(r => r.ReadAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(readModel);

        ArchitecturePostureService sut = CreateSut(reader.Object);

        ArchitecturePostureSummary summary = await sut.GetSummaryAsync(
            TenantId,
            WorkspaceId,
            ProjectId,
            cancellationToken: CancellationToken.None);

        PillarPosture security = summary.Pillars.Single(pillar => pillar.PillarKey == nameof(ArchitecturePillar.Security));
        security.FindingCounts.CriticalCount.Should().Be(2);
        security.Examination.State.Should().Be(PillarExaminationState.Examined);
        summary.ReviewIntegrity.WarningCount.Should().Be(4);
        summary.PrimaryPillarKey.Should().Be(nameof(ArchitecturePillar.Security));
        summary.LatestSnapshotCreatedUtc.Should().Be(snapshotUtc);
        summary.IsDegraded.Should().BeFalse();
    }

    [Fact]
    public async Task GetSummaryAsync_degrades_when_reader_fails()
    {
        Mock<IArchitecturePostureReader> reader = new();
        reader.Setup(r => r.ReadAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("database unavailable"));

        ArchitecturePostureService sut = CreateSut(reader.Object);

        ArchitecturePostureSummary summary = await sut.GetSummaryAsync(
            TenantId,
            WorkspaceId,
            ProjectId,
            cancellationToken: CancellationToken.None);

        summary.IsDegraded.Should().BeTrue();
        summary.Pillars.Should().OnlyContain(pillar => pillar.Examination.State == PillarExaminationState.Unavailable);
        summary.Pillars.Should().OnlyContain(pillar => pillar.Examination.ReasonText == ArchitecturePostureService.ReadFailureReason);
    }

    [Fact]
    public async Task GetSummaryAsync_selects_primary_pillar_from_highest_severity_counts()
    {
        ArchitecturePostureReadModel readModel = new()
        {
            PillarAggregates =
            [
                new PillarFindingAggregate
                {
                    PillarKey = nameof(ArchitecturePillar.Security),
                    WarningCount = 3,
                },
                new PillarFindingAggregate
                {
                    PillarKey = nameof(ArchitecturePillar.CostEffectiveness),
                    ErrorCount = 1,
                },
            ],
        };

        Mock<IArchitecturePostureReader> reader = new();
        reader.Setup(r => r.ReadAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(readModel);

        ArchitecturePostureService sut = CreateSut(reader.Object);

        ArchitecturePostureSummary summary = await sut.GetSummaryAsync(
            TenantId,
            WorkspaceId,
            ProjectId,
            cancellationToken: CancellationToken.None);

        summary.PrimaryPillarKey.Should().Be(nameof(ArchitecturePillar.CostEffectiveness));
    }

    private static ArchitecturePostureService CreateSut(IArchitecturePostureReader reader)
    {
        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(q => q.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Array.Empty<RunSummary>() as IReadOnlyList<RunSummary>, false, (string?)null));

        ScopeContext scope = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

        return new ArchitecturePostureService(
            reader,
            new ExaminationStateResolver(),
            runQuery.Object,
            PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateAuthorityQueryServiceForAnyRun(scope),
            PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateManifestHashService());
    }
}
