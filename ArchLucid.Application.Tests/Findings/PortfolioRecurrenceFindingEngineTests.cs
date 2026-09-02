using ArchLucid.Application.Findings;
using ArchLucid.Application.Findings.PortfolioRecurrence;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Application")]
public sealed class PortfolioRecurrenceFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_when_disabled_returns_empty_without_repository_calls()
    {
        Mock<IRunDetailQueryService> runQuery = new();
        Mock<IFindingsSnapshotRepository> snapshotRepository = new();
        PortfolioRecurrenceFindingEngine engine = CreateEngine(
            runQuery,
            snapshotRepository,
            enabled: false);

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(
            new GraphSnapshot { RunId = Guid.NewGuid() },
            null,
            CancellationToken.None);

        findings.Should().BeEmpty();
        runQuery.Verify(
            query => query.ListRunSummariesKeysetAsync(
                It.IsAny<string?>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        snapshotRepository.Verify(
            repository => repository.GetByIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_current_system_snapshot_missing_even_if_peers_share_finding()
    {
        Guid currentRunId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        Guid peerSnapshotId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        Finding sharedFinding = new()
        {
            Category = "Security",
            Title = "Public storage account endpoint",
            PolicyRuleId = "SEC-001",
            EngineType = "security-baseline",
            FindingType = "SecurityControlFinding",
            Severity = FindingSeverity.Warning,
            Rationale = "Storage account allows public network access.",
        };

        FindingsSnapshot peerSnapshot = new()
        {
            FindingsSnapshotId = peerSnapshotId,
            Findings = [sharedFinding],
        };

        List<RunSummary> summaries =
        [
            CreateCommittedSummary(currentRunId, "Payments", new DateTime(2026, 8, 20, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(Guid.Parse("cccccccccccccccccccccccccccccccc"), "Claims", new DateTime(2026, 8, 19, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(Guid.Parse("dddddddddddddddddddddddddddddddd"), "Billing", new DateTime(2026, 8, 18, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(Guid.Parse("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"), "Identity", new DateTime(2026, 8, 17, 0, 0, 0, DateTimeKind.Utc)),
        ];

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((summaries, false, null));

        foreach (RunSummary summary in summaries)
        {
            Guid snapshotId = string.Equals(summary.RunId, currentRunId.ToString("N"), StringComparison.OrdinalIgnoreCase)
                ? Guid.Parse("ffffffffffffffffffffffffffffffff")
                : peerSnapshotId;

            runQuery
                .Setup(query => query.GetRunDetailForRoiAsync(summary.RunId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(CreateRunDetail(summary.RunId, snapshotId));
        }

        Mock<IFindingsSnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.GetByIdAsync(It.IsAny<ScopeContext>(), peerSnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(peerSnapshot);
        snapshotRepository
            .Setup(repository => repository.GetByIdAsync(
                It.IsAny<ScopeContext>(),
                Guid.Parse("ffffffffffffffffffffffffffffffff"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((FindingsSnapshot?)null);

        PortfolioRecurrenceFindingEngine engine = CreateEngine(runQuery, snapshotRepository, enabled: true);
        GraphSnapshot graphSnapshot = new() { RunId = currentRunId };

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graphSnapshot, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_when_enabled_and_five_systems_share_violation_emits_recurrence_finding()
    {
        Guid currentRunId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        Guid snapshotId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        Finding sharedFinding = new()
        {
            Category = "Security",
            Title = "Public storage account endpoint",
            PolicyRuleId = "SEC-001",
            EngineType = "security-baseline",
            FindingType = "SecurityControlFinding",
            Severity = FindingSeverity.Warning,
            Rationale = "Storage account allows public network access.",
        };

        FindingsSnapshot sharedSnapshot = new()
        {
            FindingsSnapshotId = snapshotId,
            Findings = [sharedFinding],
        };

        List<RunSummary> summaries =
        [
            CreateCommittedSummary(currentRunId, "Payments", new DateTime(2026, 8, 20, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(Guid.Parse("cccccccccccccccccccccccccccccccc"), "Claims", new DateTime(2026, 8, 19, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(Guid.Parse("dddddddddddddddddddddddddddddddd"), "Billing", new DateTime(2026, 8, 18, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(Guid.Parse("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"), "Identity", new DateTime(2026, 8, 17, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(Guid.Parse("ffffffffffffffffffffffffffffffff"), "Reporting", new DateTime(2026, 8, 16, 0, 0, 0, DateTimeKind.Utc)),
        ];

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((summaries, false, null));

        foreach (RunSummary summary in summaries)
        {
            runQuery
                .Setup(query => query.GetRunDetailForRoiAsync(summary.RunId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(CreateRunDetail(summary.RunId, snapshotId));
        }

        Mock<IFindingsSnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.GetByIdAsync(It.IsAny<ScopeContext>(), snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(sharedSnapshot);

        PortfolioRecurrenceFindingEngine engine = CreateEngine(runQuery, snapshotRepository, enabled: true);
        GraphSnapshot graphSnapshot = new() { RunId = currentRunId };

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graphSnapshot, null, CancellationToken.None);

        findings.Should().ContainSingle();
        Finding finding = findings[0];
        finding.EngineType.Should().Be("portfolio-recurrence");
        finding.Title.Should().Be("Recurs across 5 reviewed systems");
        finding.DecisionConsequence.Should().NotBeNullOrWhiteSpace();
        finding.Rationale.Should().Contain("Payments");
        finding.Rationale.Should().Contain("Reporting");

        PortfolioRecurrenceFindingPayload payload = finding.Payload.Should().BeOfType<PortfolioRecurrenceFindingPayload>().Subject;
        payload.SystemCount.Should().Be(5);
        payload.ScannedSystemCount.Should().Be(5);
        payload.IdentityToken.Should().Be(
            "SEC-001:" + FindingSnapshotMergeKey.NormalizeFingerprint(sharedFinding.Category, sharedFinding.Title));
    }

    [Fact]
    public async Task AnalyzeAsync_when_current_snapshot_missing_uses_in_flight_identities()
    {
        Guid currentRunId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        Guid snapshotId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        Finding sharedFinding = new()
        {
            Category = "Security",
            Title = "Public storage account endpoint",
            PolicyRuleId = "SEC-001",
            EngineType = "security-baseline",
            FindingType = "SecurityControlFinding",
            Severity = FindingSeverity.Warning,
            Rationale = "Storage account allows public network access.",
        };

        string identityToken =
            "SEC-001:" + FindingSnapshotMergeKey.NormalizeFingerprint(sharedFinding.Category, sharedFinding.Title);

        FindingsSnapshot sharedSnapshot = new()
        {
            FindingsSnapshotId = snapshotId,
            Findings = [sharedFinding],
        };

        List<RunSummary> summaries =
        [
            CreateCommittedSummary(currentRunId, "Payments", new DateTime(2026, 8, 20, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(Guid.Parse("cccccccccccccccccccccccccccccccc"), "Claims", new DateTime(2026, 8, 19, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(Guid.Parse("dddddddddddddddddddddddddddddddd"), "Billing", new DateTime(2026, 8, 18, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(Guid.Parse("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"), "Identity", new DateTime(2026, 8, 17, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(Guid.Parse("ffffffffffffffffffffffffffffffff"), "Reporting", new DateTime(2026, 8, 16, 0, 0, 0, DateTimeKind.Utc)),
        ];

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((summaries, false, null));

        foreach (RunSummary summary in summaries)
        {
            if (string.Equals(summary.RunId, currentRunId.ToString("N"), StringComparison.OrdinalIgnoreCase))
            {
                runQuery
                    .Setup(query => query.GetRunDetailForRoiAsync(summary.RunId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(CreateRunDetail(summary.RunId, findingsSnapshotId: null));

                continue;
            }

            runQuery
                .Setup(query => query.GetRunDetailForRoiAsync(summary.RunId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(CreateRunDetail(summary.RunId, snapshotId));
        }

        Mock<IFindingsSnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.GetByIdAsync(It.IsAny<ScopeContext>(), snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(sharedSnapshot);

        PortfolioRecurrenceCurrentReviewIdentitySource identitySource = new();
        identitySource.SetIdentities([identityToken]);

        PortfolioRecurrenceFindingEngine engine = CreateEngine(
            runQuery,
            snapshotRepository,
            enabled: true,
            identitySource);
        GraphSnapshot graphSnapshot = new() { RunId = currentRunId };

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graphSnapshot, null, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Title.Should().Be("Recurs across 5 reviewed systems");
    }

    private static PortfolioRecurrenceFindingEngine CreateEngine(
        Mock<IRunDetailQueryService> runQuery,
        Mock<IFindingsSnapshotRepository> snapshotRepository,
        bool enabled,
        IPortfolioRecurrenceCurrentReviewIdentitySource? identitySource = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        });

        return new PortfolioRecurrenceFindingEngine(
            scopeProvider.Object,
            CreateOptionsResolver(enabled),
            new PortfolioRunScanSource(runQuery.Object, NullLogger<PortfolioRunScanSource>.Instance),
            new RecurrenceIdentityMatcher(runQuery.Object, snapshotRepository.Object, identitySource),
            new PortfolioRecurrenceFindingEmitter());
    }

    private static IPortfolioRecurrenceFindingOptionsResolver CreateOptionsResolver(bool enabled)
    {
        Mock<IPortfolioRecurrenceFindingOptionsResolver> resolver = new();
        PortfolioRecurrenceFindingOptions options = new()
        {
            Enabled = enabled,
            MinSystemCountToReport = 3,
            MaxSystemsScanned = 50,
            MaxFindings = 10,
        };

        resolver.Setup(r => r.Resolve(It.IsAny<CancellationToken>())).Returns(options);

        return resolver.Object;
    }

    private static RunSummary CreateCommittedSummary(Guid runId, string systemName, DateTime createdUtc) =>
        new()
        {
            RunId = runId.ToString("N"),
            SystemName = systemName,
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = createdUtc,
            CurrentManifestVersion = "v1",
        };

    private static ArchitectureRunDetail CreateRunDetail(string runId, Guid? findingsSnapshotId) =>
        new()
        {
            Run = new ArchitectureRun
            {
                RunId = runId,
                FindingsSnapshotId = findingsSnapshotId,
                Status = ArchitectureRunStatus.Committed,
            },
        };
}
