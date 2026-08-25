using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Roi;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Roi;

internal static class SponsorRoiSummaryServiceTestSupport
{
    internal static FindingsSnapshot CreateOpenFindingSnapshot(decimal projectedImpactUsd) =>
        new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "sponsor-roi-open-finding",
                    Category = "Security",
                    ProjectedImpactUsd = projectedImpactUsd,
                    HumanReviewStatus = FindingHumanReviewStatus.NotRequired,
                },
            ],
        };

    internal static (SponsorRoiSummaryService Service, Mock<IAzureExtractorPackageRepository> PackageRepository) CreateService(
        IRunDetailQueryService runDetailQueryService,
        ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
        ITenantRepository? tenantRepository = null,
        IScimUserRepository? scimUserRepository = null,
        SponsorRoiTenantPricingContextResolver? pricingContextResolver = null,
        IFindingReviewTrailRepository? findingReviewTrailRepository = null,
        ScopeContext? scope = null,
        TimeProvider? clock = null,
        Action<Mock<IFindingsSnapshotRepository>>? configureFindingsSnapshots = null)
    {
        ScopeContext resolvedScope = scope ?? new ScopeContext
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(resolvedScope);

        Mock<IFindingReviewTrailRepository> reviewTrail = new();
        reviewTrail
            .Setup(repo => repo.ListSinceUtcAsync(It.IsAny<Guid>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(service => service.ListActiveAsync(It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<RiskExceptionRecord>());
        riskExceptions
            .Setup(service => service.ListRetiredSinceAsync(It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<RiskExceptionRecord>());

        Mock<IArchitectureRiskRegisterService> architectureRiskRegister = new();
        architectureRiskRegister
            .Setup(service => service.GetRegisterAsync(It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<int>(), It.IsAny<ArchitectureRiskRegisterListOptions?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRiskRegisterResponse());

        Mock<ITenantSettingsRepository> tenantSettings = new();
        tenantSettings
            .Setup(repo => repo.TryGetAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.HasAnyInWorkspaceAsync(resolvedScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        packageRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(resolvedScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync((DateTime?)null);

        Mock<ICloudInventoryExtractorPackageRepository> cloudInventoryRepository = new();
        cloudInventoryRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(
                resolvedScope,
                It.IsAny<ArchLucid.Contracts.Common.CloudProvider>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((DateTime?)null);
        cloudInventoryRepository
            .Setup(repo => repo.TryGetLatestDownloadInScopeAsync(
                resolvedScope,
                It.IsAny<ArchLucid.Contracts.Common.CloudProvider>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Persistence.Models.CloudInventoryExtractorPackageDownloadRecord?)null);

        RoiCostEvidenceFreshnessEvaluator freshnessEvaluator = new(
            packageRepository.Object,
            cloudInventoryRepository.Object,
            scopeProvider.Object,
            clock ?? TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions()));

        RoiCostEvidenceCollectionResolver collectionResolver = new(
            packageRepository.Object,
            cloudInventoryRepository.Object);

        SponsorRoiTenantPricingContextResolver tenantPricingContextResolver =
            pricingContextResolver ?? CreateDefaultPricingContextResolver(resolvedScope);

        SponsorRoiPricingLabelResolver pricingLabelResolver = new(
            tenantPricingContextResolver,
            freshnessEvaluator,
            collectionResolver,
            scopeProvider.Object);

        Mock<IFindingsSnapshotRepository> findingsSnapshots = new();
        findingsSnapshots
            .Setup(repo => repo.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((FindingsSnapshot?)null);

        configureFindingsSnapshots?.Invoke(findingsSnapshots);

        Mock<ITenantCostSettingsRepository> tenantCostSettings = new();
        tenantCostSettings
            .Setup(repo => repo.TryGetAsync(resolvedScope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantCostSettingsRecord?)null);

        IFindingReviewTrailRepository resolvedReviewTrail = findingReviewTrailRepository ?? reviewTrail.Object;
        ValueReportComputationOptions valueReportOptions = new();

        SponsorRoiRunCollector runCollector = new(
            runDetailQueryService,
            tenantEstimatedUsdSavingsResolver,
            scopeProvider.Object,
            resolvedReviewTrail,
            riskExceptions.Object,
            findingsSnapshots.Object,
            tenantCostSettings.Object,
            Options.Create(valueReportOptions),
            NullLogger<SponsorRoiRunCollector>.Instance);

        SponsorRoiSummaryBuilder summaryBuilder = new(
            runCollector,
            pricingLabelResolver,
            scopeProvider.Object,
            resolvedReviewTrail,
            riskExceptions.Object,
            architectureRiskRegister.Object,
            tenantSettings.Object,
            runDetailQueryService,
            CreateDefaultPilotScorecardMetricsReader(),
            NullLogger<SponsorRoiSummaryBuilder>.Instance);

        SponsorRoiHistoryBuilder historyBuilder = new(
            runCollector,
            runDetailQueryService,
            NullLogger<SponsorRoiHistoryBuilder>.Instance);

        SponsorRoiExportBuilder exportBuilder = new(
            runCollector,
            pricingLabelResolver);

        CrossTenantPortfolioSummaryBuilder portfolioBuilder = new(
            runCollector,
            tenantRepository ?? Mock.Of<ITenantRepository>(),
            scimUserRepository ?? Mock.Of<IScimUserRepository>(),
            NullLogger<CrossTenantPortfolioSummaryBuilder>.Instance);

        SponsorRoiSummaryService service = new(
            summaryBuilder,
            historyBuilder,
            exportBuilder,
            portfolioBuilder);

        return (service, packageRepository);
    }

    internal static SponsorRoiTenantPricingContextResolver CreateDefaultPricingContextResolver(ScopeContext? scope = null)
    {
        ScopeContext resolvedScope = scope ?? new ScopeContext
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

        Mock<ITenantCostSettingsRepository> repository = new();
        repository
            .Setup(repo => repo.TryGetAsync(resolvedScope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Persistence.Roi.TenantCostSettingsRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(resolvedScope);

        return new SponsorRoiTenantPricingContextResolver(repository.Object, scopeProvider.Object);
    }

    internal static IPilotScorecardMetricsReader CreateDefaultPilotScorecardMetricsReader()
    {
        Mock<IPilotScorecardMetricsReader> reader = new();
        reader
            .Setup(metricsReader => metricsReader.GetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PilotScorecardTenantMetrics());

        return reader.Object;
    }
}
