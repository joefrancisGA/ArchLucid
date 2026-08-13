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
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Roi;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
public sealed class SponsorRoiSummaryServiceExtendedTests
{
    [Fact]
    public async Task GetCrossTenantPortfolioSummaryAsync_returns_k_anonymity_false_when_fewer_than_five_tenants()
    {
        List<TenantRecord> tenants = Enumerable.Range(0, 4)
            .Select(index => CreateTenant(Guid.Parse($"00000000-0000-0000-0000-{index:D12}")))
            .ToList();

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(repo => repo.ListAsync(It.IsAny<CancellationToken>())).ReturnsAsync(tenants);

        Mock<IScimUserRepository> scimRepository = new();
        scimRepository
            .Setup(repo => repo.GetByExternalIdAsync(It.IsAny<Guid>(), "user-key", It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateActiveUser());

        SponsorRoiSummaryService sut = CreateSut(
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<ITenantEstimatedUsdSavingsResolver>(),
            tenantRepository.Object,
            scimRepository.Object);

        CrossTenantPortfolioSummaryResponse response =
            await sut.GetCrossTenantPortfolioSummaryAsync("user-key", CancellationToken.None);

        response.IsKAnonymitySatisfied.Should().BeFalse();
    }

    [Fact]
    public async Task GetCrossTenantPortfolioSummaryAsync_aggregates_across_five_accessible_tenants()
    {
        List<TenantRecord> tenants = Enumerable.Range(0, 5)
            .Select(index => CreateTenant(Guid.Parse($"10000000-0000-0000-0000-{index:D12}")))
            .ToList();

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(repo => repo.ListAsync(It.IsAny<CancellationToken>())).ReturnsAsync(tenants);

        Mock<IScimUserRepository> scimRepository = new();
        scimRepository
            .Setup(repo => repo.GetByExternalIdAsync(It.IsAny<Guid>(), "user-key", It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateActiveUser());

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Array.Empty<RunSummary>(), false, null));

        SponsorRoiSummaryService sut = CreateSut(
            runQuery.Object,
            Mock.Of<ITenantEstimatedUsdSavingsResolver>(),
            tenantRepository.Object,
            scimRepository.Object);

        CrossTenantPortfolioSummaryResponse response =
            await sut.GetCrossTenantPortfolioSummaryAsync("user-key", CancellationToken.None);

        response.IsKAnonymitySatisfied.Should().BeTrue();
        response.TotalSystemCount.Should().Be(0);
        response.TotalEstimatedUsdSavings.Should().Be(0m);
    }

    [Fact]
    public async Task GetCrossTenantPortfolioSummaryAsync_deduplicates_critical_findings_when_same_finding_id_spans_systems()
    {
        DateTime committedUtc = new(2026, 4, 10, 0, 0, 0, DateTimeKind.Utc);
        Guid primaryTenantId = Guid.Parse("10000000-0000-0000-0000-000000000001");
        Guid paymentsRunId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        Guid claimsRunId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        const string sharedFindingId = "finding-shared-across-systems";

        List<TenantRecord> tenants = CreateFiveAccessibleTenants(primaryTenantId);

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

        Mock<IRunDetailQueryService> runQuery = CreateTenantScopedRunQuery(
            primaryTenantId,
            [paymentsSummary, claimsSummary]);

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(paymentsRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(paymentsRunId, "Payments", null, committedUtc,
            [
                new ArchitectureFinding
                {
                    FindingId = sharedFindingId,
                    Category = "Security",
                    Severity = FindingSeverity.Critical,
                    Message = "shared critical issue",
                },
            ]));

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(claimsRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(claimsRunId, "Claims", null, committedUtc,
            [
                new ArchitectureFinding
                {
                    FindingId = sharedFindingId.ToUpperInvariant(),
                    Category = "Security",
                    Severity = FindingSeverity.Critical,
                    Message = "same stable id on another system",
                },
            ]));

        SponsorRoiSummaryService sut = CreateSutWithAccessibleTenants(
            runQuery.Object,
            Mock.Of<ITenantEstimatedUsdSavingsResolver>(),
            tenants);

        CrossTenantPortfolioSummaryResponse response =
            await sut.GetCrossTenantPortfolioSummaryAsync("user-key", CancellationToken.None);

        response.IsKAnonymitySatisfied.Should().BeTrue();
        response.TotalCriticalFindings.Should().Be(1);
        response.TopSystemicIssues.Should().ContainSingle(issue =>
            issue.Category == "Security"
            && issue.Severity == nameof(FindingSeverity.Critical)
            && issue.Count == 1);
    }

    [Fact]
    public async Task GetCrossTenantPortfolioSummaryAsync_does_not_deduplicate_findings_with_null_or_empty_finding_id()
    {
        DateTime committedUtc = new(2026, 4, 10, 0, 0, 0, DateTimeKind.Utc);
        Guid primaryTenantId = Guid.Parse("10000000-0000-0000-0000-000000000002");
        Guid paymentsRunId = Guid.Parse("cccccccccccccccccccccccccccccccc");
        Guid claimsRunId = Guid.Parse("dddddddddddddddddddddddddddddddd");

        List<TenantRecord> tenants = CreateFiveAccessibleTenants(primaryTenantId);

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

        Mock<IRunDetailQueryService> runQuery = CreateTenantScopedRunQuery(
            primaryTenantId,
            [paymentsSummary, claimsSummary]);

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(paymentsRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(paymentsRunId, "Payments", null, committedUtc,
            [
                new ArchitectureFinding
                {
                    FindingId = string.Empty,
                    Category = "Security",
                    Severity = FindingSeverity.Critical,
                    Message = "no stable id",
                },
            ]));

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(claimsRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(claimsRunId, "Claims", null, committedUtc,
            [
                new ArchitectureFinding
                {
                    FindingId = "   ",
                    Category = "Security",
                    Severity = FindingSeverity.Critical,
                    Message = "whitespace id is not stable",
                },
            ]));

        SponsorRoiSummaryService sut = CreateSutWithAccessibleTenants(
            runQuery.Object,
            Mock.Of<ITenantEstimatedUsdSavingsResolver>(),
            tenants);

        CrossTenantPortfolioSummaryResponse response =
            await sut.GetCrossTenantPortfolioSummaryAsync("user-key", CancellationToken.None);

        response.TotalCriticalFindings.Should().Be(2);
        response.TopSystemicIssues.Should().ContainSingle(issue =>
            issue.Category == "Security"
            && issue.Severity == nameof(FindingSeverity.Critical)
            && issue.Count == 2);
    }

    [Fact]
    public async Task GetCrossTenantPortfolioSummaryAsync_sums_snapshot_savings_per_system_without_double_counting_from_dedup()
    {
        DateTime committedUtc = new(2026, 4, 10, 0, 0, 0, DateTimeKind.Utc);
        Guid primaryTenantId = Guid.Parse("10000000-0000-0000-0000-000000000003");
        Guid paymentsRunId = Guid.Parse("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
        Guid claimsRunId = Guid.Parse("ffffffffffffffffffffffffffffffff");
        Guid paymentsSnapshotId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid claimsSnapshotId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        const string sharedFindingId = "finding-shared-savings-context";

        List<TenantRecord> tenants = CreateFiveAccessibleTenants(primaryTenantId);

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

        Mock<IRunDetailQueryService> runQuery = CreateTenantScopedRunQuery(
            primaryTenantId,
            [paymentsSummary, claimsSummary]);

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(paymentsRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(paymentsRunId, "Payments", paymentsSnapshotId, committedUtc,
            [
                new ArchitectureFinding
                {
                    FindingId = sharedFindingId,
                    Category = "CostOptimization",
                    Severity = FindingSeverity.Warning,
                    Message = "shared",
                    EstimatedUsdSavings = 9000m,
                },
            ]));

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(claimsRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(claimsRunId, "Claims", claimsSnapshotId, committedUtc,
            [
                new ArchitectureFinding
                {
                    FindingId = sharedFindingId,
                    Category = "CostOptimization",
                    Severity = FindingSeverity.Warning,
                    Message = "duplicate id",
                    EstimatedUsdSavings = 9000m,
                },
            ]));

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(repo => repo.ListAsync(It.IsAny<CancellationToken>())).ReturnsAsync(tenants);

        Mock<IScimUserRepository> scimRepository = new();
        scimRepository
            .Setup(repo => repo.GetByExternalIdAsync(It.IsAny<Guid>(), "user-key", It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateActiveUser());

        SponsorRoiSummaryService sut = SponsorRoiSummaryServiceTestSupport.CreateService(
            runQuery.Object,
            Mock.Of<ITenantEstimatedUsdSavingsResolver>(),
            tenantRepository.Object,
            scimRepository.Object,
            configureFindingsSnapshots: findingsSnapshots =>
            {
                findingsSnapshots
                    .Setup(repo => repo.GetByIdAsync(It.IsAny<ScopeContext>(), paymentsSnapshotId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(SponsorRoiSummaryServiceTestSupport.CreateOpenFindingSnapshot(5000m));
                findingsSnapshots
                    .Setup(repo => repo.GetByIdAsync(It.IsAny<ScopeContext>(), claimsSnapshotId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(SponsorRoiSummaryServiceTestSupport.CreateOpenFindingSnapshot(3000m));
            }).Service;

        CrossTenantPortfolioSummaryResponse response =
            await sut.GetCrossTenantPortfolioSummaryAsync("user-key", CancellationToken.None);

        // Disposition-aware headline sums open snapshot USD per latest run per system; finding-id dedup affects issues only.
        response.TotalEstimatedUsdSavings.Should().Be(8000m);
        response.HeadlineSavingsScopeCode.Should().Be(RoiSponsorFacingScopeCodes.CrossTenantPortfolioHeadline);
        response.TopSystemicIssues.Should().ContainSingle(issue =>
            issue.Category == "CostOptimization"
            && issue.Severity == nameof(FindingSeverity.Warning)
            && issue.Count == 1);
    }

    [Fact]
    public async Task GetCrossTenantPortfolioSummaryAsync_excludes_muted_findings_from_deduped_totals()
    {
        DateTime committedUtc = new(2026, 4, 10, 0, 0, 0, DateTimeKind.Utc);
        Guid primaryTenantId = Guid.Parse("10000000-0000-0000-0000-000000000004");
        Guid runId = Guid.Parse("99999999999999999999999999999999");
        const string sharedFindingId = "finding-muted-duplicate";

        List<TenantRecord> tenants = CreateFiveAccessibleTenants(primaryTenantId);

        RunSummary summary = new()
        {
            RunId = runId.ToString("N"),
            SystemName = "Payments",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = committedUtc,
            CurrentManifestVersion = "v1",
        };

        Mock<IRunDetailQueryService> runQuery = CreateTenantScopedRunQuery(primaryTenantId, [summary]);

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(runId, "Payments", null, committedUtc,
            [
                new ArchitectureFinding
                {
                    FindingId = sharedFindingId,
                    Category = "Security",
                    Severity = FindingSeverity.Critical,
                    Message = "active",
                },
                new ArchitectureFinding
                {
                    FindingId = sharedFindingId,
                    Category = "Security",
                    Severity = FindingSeverity.Critical,
                    Message = "muted duplicate",
                    IsMuted = true,
                },
            ]));

        SponsorRoiSummaryService sut = CreateSutWithAccessibleTenants(
            runQuery.Object,
            Mock.Of<ITenantEstimatedUsdSavingsResolver>(),
            tenants);

        CrossTenantPortfolioSummaryResponse response =
            await sut.GetCrossTenantPortfolioSummaryAsync("user-key", CancellationToken.None);

        response.TotalCriticalFindings.Should().Be(1);
    }

    [Fact]
    public async Task BuildHistoryAsync_excludes_runs_older_than_six_months()
    {
        DateTime recent = TimeProvider.System.UtcNowDateTime().AddMonths(-1);
        DateTime stale = TimeProvider.System.UtcNowDateTime().AddMonths(-8);
        Guid recentRunId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        RunSummary recentSummary = new()
        {
            RunId = recentRunId.ToString("N"),
            SystemName = "Payments",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = recent,
        };

        RunSummary staleSummary = new()
        {
            RunId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb").ToString("N"),
            SystemName = "Claims",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = stale,
        };

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((new[] { recentSummary, staleSummary }, false, null));

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(recentRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(recentRunId, "Payments", null, recent, []));

        SponsorRoiSummaryService sut = CreateSut(runQuery.Object, Mock.Of<ITenantEstimatedUsdSavingsResolver>());

        SponsorRoiHistoryResponse response = await sut.BuildHistoryAsync(CancellationToken.None);

        response.Points.Should().ContainSingle();
        response.Points[0].SnapshotUtc.Should().Be(new DateTimeOffset(recent, TimeSpan.Zero));
    }

    [Fact]
    public async Task BuildHistoryAsync_pro_rates_savings_by_real_and_simulator_run_counts()
    {
        // Regression guard for TB-239 — mixed-mode history must not present simulator-only totals as buyer-realized savings.
        DateTime monthUtc = new(2026, 4, 15, 0, 0, 0, DateTimeKind.Utc);
        Guid[] runIds =
        [
            Guid.Parse("11111111111111111111111111111111"),
            Guid.Parse("22222222222222222222222222222222"),
            Guid.Parse("33333333333333333333333333333333"),
            Guid.Parse("44444444444444444444444444444444"),
            Guid.Parse("55555555555555555555555555555555"),
        ];

        List<RunSummary> summaries =
        [
            new RunSummary { RunId = runIds[0].ToString("N"), SystemName = "A", Status = nameof(ArchitectureRunStatus.Committed), CreatedUtc = monthUtc },
            new RunSummary { RunId = runIds[1].ToString("N"), SystemName = "B", Status = nameof(ArchitectureRunStatus.Committed), CreatedUtc = monthUtc },
            new RunSummary { RunId = runIds[2].ToString("N"), SystemName = "C", Status = nameof(ArchitectureRunStatus.Committed), CreatedUtc = monthUtc },
            new RunSummary { RunId = runIds[3].ToString("N"), SystemName = "D", Status = nameof(ArchitectureRunStatus.Committed), CreatedUtc = monthUtc },
            new RunSummary { RunId = runIds[4].ToString("N"), SystemName = "E", Status = nameof(ArchitectureRunStatus.Committed), CreatedUtc = monthUtc },
        ];

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((summaries, false, null));

        Mock<ITenantEstimatedUsdSavingsResolver> savingsResolver = new();
        savingsResolver
            .Setup(resolver => resolver.ResolveFromFindingsSnapshotIdAsync(It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(100m);

        for (int index = 0; index < runIds.Length; index += 1)
        {
            Guid runId = runIds[index];
            StructuralExecutionMode mode = index < 3 ? StructuralExecutionMode.Real : StructuralExecutionMode.Simulator;
            string runIdHex = runId.ToString("N");

            runQuery
                .Setup(query => query.GetRunDetailForRoiAsync(runIdHex, It.IsAny<CancellationToken>()))
                .ReturnsAsync(BuildDetail(runId, $"System-{index}", Guid.NewGuid(), monthUtc, [], structuralExecutionMode: mode));
        }

        SponsorRoiSummaryService sut = CreateSut(runQuery.Object, savingsResolver.Object);

        SponsorRoiHistoryResponse response = await sut.BuildHistoryAsync(CancellationToken.None);

        response.Points.Should().ContainSingle();
        SponsorRoiHistoryPoint point = response.Points[0];
        point.RealRunCount.Should().Be(3);
        point.SimulatorRunCount.Should().Be(2);
        point.TotalEstimatedUsdSavings.Should().Be(500m);
        point.RealModeSavingsUsd.Should().Be(300m);
        point.IsMixedMode.Should().BeTrue();
    }

    [Fact]
    public async Task BuildExportAsync_deduplicates_findings_and_aggregates_environment_savings()
    {
        DateTime committedUtc = new(2026, 4, 10, 0, 0, 0, DateTimeKind.Utc);
        Guid runId = Guid.Parse("cccccccccccccccccccccccccccccccc");
        const string sharedFindingId = "finding-export-shared";

        RunSummary summary = new()
        {
            RunId = runId.ToString("N"),
            SystemName = "Payments",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = committedUtc,
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
                    FindingId = sharedFindingId,
                    Category = "CostOptimization",
                    Severity = FindingSeverity.Warning,
                    Message = "first",
                    EstimatedUsdSavings = 100m,
                },
                new ArchitectureFinding
                {
                    FindingId = sharedFindingId.ToUpperInvariant(),
                    Category = "CostOptimization",
                    Severity = FindingSeverity.Warning,
                    Message = "duplicate",
                    EstimatedUsdSavings = 50m,
                },
            ], "env:production"));

        SponsorRoiSummaryService sut = CreateSut(runQuery.Object, Mock.Of<ITenantEstimatedUsdSavingsResolver>());

        SponsorRoiExportResponse response = await sut.BuildExportAsync(CancellationToken.None);

        response.Rows.Should().ContainSingle();
        response.Rows[0].Environment.Should().Be("production");
        response.SavingsByEnvironment.Should().ContainSingle(slice =>
            slice.Environment == "production" && slice.EstimatedUsdSavings == 100m);
        response.SavingsPricingBasis.Should().Be(SponsorRoiSavingsPricingBasis.Retail);
        response.EaDiscountMultiplier.Should().Be(1.0m);
        response.CostEvidenceFreshnessStatus.Should().Be(RoiCostEvidenceFreshness.Missing);
        response.SavingsPricingBasisDescription.Should().NotBeNullOrWhiteSpace();
    }

    private static SponsorRoiSummaryService CreateSut(
        IRunDetailQueryService runDetailQueryService,
        ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
        ITenantRepository? tenantRepository = null,
        IScimUserRepository? scimUserRepository = null,
        SponsorRoiTenantPricingContextResolver? pricingContextResolver = null,
        IFindingReviewTrailRepository? findingReviewTrailRepository = null)
    {
        return SponsorRoiSummaryServiceTestSupport.CreateService(
            runDetailQueryService,
            tenantEstimatedUsdSavingsResolver,
            tenantRepository,
            scimUserRepository,
            pricingContextResolver,
            findingReviewTrailRepository).Service;
    }

    private static SponsorRoiTenantPricingContextResolver CreateDefaultPricingContextResolver()
    {
        return SponsorRoiSummaryServiceTestSupport.CreateDefaultPricingContextResolver();
    }

    private static SponsorRoiSummaryService CreateSutWithAccessibleTenants(
        IRunDetailQueryService runDetailQueryService,
        ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
        IReadOnlyList<TenantRecord> tenants)
    {
        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(repo => repo.ListAsync(It.IsAny<CancellationToken>())).ReturnsAsync(tenants);

        Mock<IScimUserRepository> scimRepository = new();
        scimRepository
            .Setup(repo => repo.GetByExternalIdAsync(It.IsAny<Guid>(), "user-key", It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateActiveUser());

        return CreateSut(runDetailQueryService, tenantEstimatedUsdSavingsResolver, tenantRepository.Object, scimRepository.Object);
    }

    private static List<TenantRecord> CreateFiveAccessibleTenants(Guid primaryTenantId)
    {
        List<TenantRecord> tenants =
        [
            CreateTenant(primaryTenantId),
            CreateTenant(Guid.Parse("10000000-0000-0000-0000-000000000010")),
            CreateTenant(Guid.Parse("10000000-0000-0000-0000-000000000011")),
            CreateTenant(Guid.Parse("10000000-0000-0000-0000-000000000012")),
            CreateTenant(Guid.Parse("10000000-0000-0000-0000-000000000013")),
        ];

        return tenants;
    }

    private static Mock<IRunDetailQueryService> CreateTenantScopedRunQuery(
        Guid primaryTenantId,
        IReadOnlyList<RunSummary> primaryTenantSummaries)
    {
        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                Guid? tenantId = AmbientScopeContext.CurrentOverride?.TenantId;

                if (tenantId == primaryTenantId)
                    return (primaryTenantSummaries, false, (string?)null);

                return (Array.Empty<RunSummary>(), false, null);
            });

        return runQuery;
    }

    private static TenantRecord CreateTenant(Guid tenantId)
    {
        return new TenantRecord
        {
            Id = tenantId,
            Name = tenantId.ToString("N"),
            Slug = tenantId.ToString("N")[..12],
            Tier = TenantTier.Enterprise,
        };
    }

    private static ScimUserRecord CreateActiveUser()
    {
        return new ScimUserRecord
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            ExternalId = "user-key",
            UserName = "user-key",
            Active = true,
            CreatedUtc = DateTimeOffset.UtcNow,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };
    }

    private static ArchitectureRunDetail BuildDetail(
        Guid runId,
        string systemName,
        Guid? findingsSnapshotId,
        DateTime committedUtc,
        IReadOnlyList<ArchitectureFinding> findings,
        string? environmentTag = null,
        StructuralExecutionMode structuralExecutionMode = StructuralExecutionMode.Simulator)
    {
        GoldenManifest manifest = new()
        {
            RunId = runId.ToString("N"),
            SystemName = systemName,
            Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = committedUtc },
            Governance = new ManifestGovernance(),
        };

        if (!string.IsNullOrWhiteSpace(environmentTag))
        {
            manifest.Services =
            [
                new ManifestService
                {
                    ServiceName = "api",
                    Tags = [environmentTag],
                },
            ];
        }

        ArchitectureRun run = new()
        {
            RunId = runId.ToString("N"),
            RequestId = "req",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = committedUtc.AddHours(-1),
            CompletedUtc = committedUtc,
            CurrentManifestVersion = "v1",
            FindingsSnapshotId = findingsSnapshotId,
            StructuralExecutionMode = structuralExecutionMode,
        };

        return new ArchitectureRunDetail
        {
            Run = run,
            Manifest = manifest,
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
