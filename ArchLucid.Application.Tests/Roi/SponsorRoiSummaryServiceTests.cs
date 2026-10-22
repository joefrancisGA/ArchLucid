using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Roi;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
public sealed class SponsorRoiSummaryServiceTests
{
    [Fact]
    public async Task BuildAsync_returns_empty_summary_when_no_committed_runs()
    {
        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Array.Empty<RunSummary>(), false, null));

        SponsorRoiSummaryService sut = CreateSut(runQuery.Object, Mock.Of<ITenantEstimatedUsdSavingsResolver>());

        SponsorRoiSummaryResponse response = await sut.BuildAsync(CancellationToken.None);

        response.TotalEstimatedUsdSavings.Should().Be(0m);
        response.SystemCount.Should().Be(0);
        response.TopSystemicIssues.Should().BeEmpty();
    }

    [Fact]
    public async Task BuildAsync_uses_latest_run_per_system_and_sums_savings()
    {
        DateTime older = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime newer = new(2026, 4, 10, 0, 0, 0, DateTimeKind.Utc);
        Guid olderRunId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        Guid newerRunId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        Guid findingsSnapshotId = Guid.Parse("cccccccccccccccccccccccccccccccc");

        RunSummary olderSummary = new()
        {
            RunId = olderRunId.ToString("N"),
            SystemName = "Payments",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = older,
            CurrentManifestVersion = "v1",
        };

        RunSummary newerSummary = new()
        {
            RunId = newerRunId.ToString("N"),
            SystemName = "Payments",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = newer,
            CurrentManifestVersion = "v2",
        };

        RunSummary otherSystemSummary = new()
        {
            RunId = Guid.Parse("dddddddddddddddddddddddddddddddd").ToString("N"),
            SystemName = "Claims",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = newer,
            CurrentManifestVersion = "v1",
        };

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((new[] { newerSummary, olderSummary, otherSystemSummary }, false, null));

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(newerRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(newerRunId, "Payments", findingsSnapshotId, newer, [
                new ArchitectureFinding { Category = "Security", Severity = FindingSeverity.Error, Message = "a" },
                new ArchitectureFinding { Category = "Security", Severity = FindingSeverity.Error, Message = "b" },
            ]));

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(otherSystemSummary.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(Guid.Parse(otherSystemSummary.RunId), "Claims", null, newer, [
                new ArchitectureFinding { Category = "Compliance", Severity = FindingSeverity.Warning, Message = "c" },
            ]));

        Mock<ITenantEstimatedUsdSavingsResolver> savingsResolver = new();
        savingsResolver
            .Setup(resolver => resolver.ResolveFromFindingsSnapshotIdAsync(findingsSnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(12500m);

        SponsorRoiSummaryService sut = CreateSut(
            runQuery.Object,
            savingsResolver.Object,
            configureFindingsSnapshots: mock =>
            {
                mock
                    .Setup(repo => repo.GetByIdAsync(It.IsAny<ScopeContext>(), findingsSnapshotId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(SponsorRoiSummaryServiceTestSupport.CreateOpenFindingSnapshot(12500m));
            });

        SponsorRoiSummaryResponse response = await sut.BuildAsync(CancellationToken.None);

        response.SystemCount.Should().Be(2);
        response.TotalEstimatedUsdSavings.Should().Be(12500m);
        response.Systems.Should().ContainSingle(system => system.SystemName == "Payments" && system.EstimatedUsdSavings == 12500m);
        response.TopSystemicIssues.Should().HaveCount(2);
        response.TopSystemicIssues[0].Category.Should().Be("Security");
        response.TopSystemicIssues[0].Severity.Should().Be(nameof(FindingSeverity.Error));
        response.TopSystemicIssues[0].Count.Should().Be(2);
        runQuery.Verify(
            query => query.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        runQuery.Verify(
            query => query.GetRunDetailForRoiAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task BuildAsync_deduplicates_top_systemic_issues_by_stable_finding_id_across_runs()
    {
        DateTime committedUtc = new(2026, 4, 10, 0, 0, 0, DateTimeKind.Utc);
        const string sharedFindingId = "finding-shared-across-systems";
        Guid paymentsRunId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        Guid claimsRunId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");

        RunSummary paymentsSummary = new()
        {
            RunId = paymentsRunId.ToString("N"),
            SystemName = "Payments",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = committedUtc,
            CurrentManifestVersion = "v1",
        };

        RunSummary claimsSummary = new()
        {
            RunId = claimsRunId.ToString("N"),
            SystemName = "Claims",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = committedUtc,
            CurrentManifestVersion = "v1",
        };

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((new[] { paymentsSummary, claimsSummary }, false, null));

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(paymentsRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(paymentsRunId, "Payments", null, committedUtc, [
                new ArchitectureFinding
                {
                    FindingId = sharedFindingId,
                    Category = "Security",
                    Severity = FindingSeverity.Error,
                    Message = "shared issue",
                },
            ]));

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(claimsRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(claimsRunId, "Claims", null, committedUtc, [
                new ArchitectureFinding
                {
                    FindingId = sharedFindingId.ToUpperInvariant(),
                    Category = "Security",
                    Severity = FindingSeverity.Error,
                    Message = "same stable id on another system",
                },
            ]));

        SponsorRoiSummaryService sut = CreateSut(runQuery.Object, Mock.Of<ITenantEstimatedUsdSavingsResolver>());

        SponsorRoiSummaryResponse response = await sut.BuildAsync(CancellationToken.None);

        response.SystemCount.Should().Be(2);
        response.TopSystemicIssues.Should().ContainSingle();
        response.TopSystemicIssues[0].Category.Should().Be("Security");
        response.TopSystemicIssues[0].Severity.Should().Be(nameof(FindingSeverity.Error));
        response.TopSystemicIssues[0].Count.Should().Be(1);
    }

    [Fact]
    public async Task BuildExportAsync_preserves_all_rows_when_finding_id_is_null_or_empty()
    {
        DateTime committedUtc = new(2026, 4, 10, 0, 0, 0, DateTimeKind.Utc);
        Guid runId = Guid.Parse("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");

        RunSummary summary = new()
        {
            RunId = runId.ToString("N"),
            SystemName = "Payments",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = committedUtc,
            CurrentManifestVersion = "v1",
        };

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((new[] { summary }, false, null));

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(runId, "Payments", null, committedUtc,
            [
                new ArchitectureFinding
                {
                    FindingId = string.Empty,
                    Category = "Security",
                    Severity = FindingSeverity.Error,
                    Message = "no id",
                    EstimatedUsdSavings = 100m,
                },
                new ArchitectureFinding
                {
                    FindingId = "   ",
                    Category = "Security",
                    Severity = FindingSeverity.Error,
                    Message = "blank id",
                    EstimatedUsdSavings = 200m,
                },
                new ArchitectureFinding
                {
                    FindingId = string.Empty,
                    Category = "Security",
                    Severity = FindingSeverity.Error,
                    Message = "also no id",
                    EstimatedUsdSavings = 300m,
                },
            ]));

        SponsorRoiSummaryService sut = CreateSut(runQuery.Object, Mock.Of<ITenantEstimatedUsdSavingsResolver>());

        SponsorRoiExportResponse response = await sut.BuildExportAsync(CancellationToken.None);

        response.Rows.Should().HaveCount(3);
        response.Rows.Sum(row => row.EstimatedUsdSavings ?? 0m).Should().Be(600m);
    }

    private static SponsorRoiSummaryService CreateSut(
        IRunDetailQueryService runDetailQueryService,
        ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
        SponsorRoiTenantPricingContextResolver? pricingContextResolver = null,
        IFindingReviewTrailRepository? findingReviewTrailRepository = null,
        Action<Mock<IFindingsSnapshotRepository>>? configureFindingsSnapshots = null)
    {
        return SponsorRoiSummaryServiceTestSupport.CreateService(
            runDetailQueryService,
            tenantEstimatedUsdSavingsResolver,
            pricingContextResolver: pricingContextResolver,
            findingReviewTrailRepository: findingReviewTrailRepository,
            configureFindingsSnapshots: configureFindingsSnapshots).Service;
    }

    private static SponsorRoiTenantPricingContextResolver CreateDefaultPricingContextResolver()
    {
        return SponsorRoiSummaryServiceTestSupport.CreateDefaultPricingContextResolver();
    }

    private static ArchitectureRunDetail BuildDetail(
        Guid runId,
        string systemName,
        Guid? findingsSnapshotId,
        DateTime committedUtc,
        IReadOnlyList<ArchitectureFinding> findings)
    {
        ArchitectureRun run = new()
        {
            RunId = runId.ToString("N"),
            RequestId = "req",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = committedUtc.AddHours(-1),
            CompletedUtc = committedUtc,
            CurrentManifestVersion = "v1",
            FindingsSnapshotId = findingsSnapshotId,
        };

        return new ArchitectureRunDetail
        {
            Run = run,
            Manifest = new GoldenManifest
            {
                RunId = run.RunId,
                SystemName = systemName,
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = committedUtc },
                Governance = new ManifestGovernance(),
            },
            Results =
            [
                new AgentResult
                {
                    TaskId = "t1",
                    RunId = run.RunId,
                    AgentType = AgentType.Topology,
                    Findings = findings.ToList(),
                },
            ],
        };
    }
}
