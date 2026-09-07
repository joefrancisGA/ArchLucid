using ArchLucid.Application.Findings;
using ArchLucid.Application.Findings.PortfolioRecurrence;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>Constructs no-op-safe effectful engines for the golden corpus harness (DX-14).</summary>
internal static class GoldenCorpusEffectfulEngineFactory
{
    internal static IEffectfulFindingEngine[] Create(
        IScopeContextProvider scopeContextProvider,
        IAzureExtractorPackageRepository azurePackageRepository,
        ICloudInventoryExtractorPackageRepository cloudPackageRepository,
        TimeProvider timeProvider)
    {
        ArgumentNullException.ThrowIfNull(scopeContextProvider);
        ArgumentNullException.ThrowIfNull(azurePackageRepository);
        ArgumentNullException.ThrowIfNull(cloudPackageRepository);
        ArgumentNullException.ThrowIfNull(timeProvider);

        IOptions<RoiCostEvidenceFreshnessOptions> freshnessOptions =
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 });

        IOptions<OpenCommitmentFindingOptions> disabledOpenCommitment =
            Options.Create(new OpenCommitmentFindingOptions { Enabled = false });

        IFindingReviewTrailRepository reviewTrailRepository = new NoOpFindingReviewTrailRepository();
        IRiskExceptionService riskExceptionService = Mock.Of<IRiskExceptionService>();
        IFindingInspectReadRepository findingInspectReadRepository = Mock.Of<IFindingInspectReadRepository>();

        IPortfolioRecurrenceFindingOptionsResolver disabledPortfolioRecurrence =
            new DisabledPortfolioRecurrenceFindingOptionsResolver();

        IPortfolioRunScanSource emptyRunScanSource = new EmptyPortfolioRunScanSource();

        IRecurrenceIdentityMatcher identityMatcher = Mock.Of<IRecurrenceIdentityMatcher>();
        IPortfolioRecurrenceFindingEmitter findingEmitter = Mock.Of<IPortfolioRecurrenceFindingEmitter>();

        return
        [
            new OrphanedAzureResourceFindingEngine(scopeContextProvider, azurePackageRepository, timeProvider, freshnessOptions),
            new AdvisorCostRecommendationFindingEngine(scopeContextProvider, azurePackageRepository, timeProvider, freshnessOptions),
            new GraphAzureInventoryReconciliationFindingEngine(scopeContextProvider, azurePackageRepository, timeProvider, freshnessOptions),
            new GraphAwsInventoryReconciliationFindingEngine(scopeContextProvider, cloudPackageRepository, timeProvider, freshnessOptions),
            new GraphGcpInventoryReconciliationFindingEngine(scopeContextProvider, cloudPackageRepository, timeProvider, freshnessOptions),
            new DeclarationInventoryContradictionFindingEngine(
                scopeContextProvider,
                azurePackageRepository,
                cloudPackageRepository,
                timeProvider,
                freshnessOptions),
            new OrphanedAwsResourceFindingEngine(scopeContextProvider, cloudPackageRepository, timeProvider, freshnessOptions),
            new OrphanedGcpResourceFindingEngine(scopeContextProvider, cloudPackageRepository, timeProvider, freshnessOptions),
            new AwsCostRecommendationFindingEngine(scopeContextProvider, cloudPackageRepository, timeProvider, freshnessOptions),
            new GcpCostRecommendationFindingEngine(scopeContextProvider, cloudPackageRepository, timeProvider, freshnessOptions),
            new AzureInventorySecurityBaselineFindingEngine(scopeContextProvider, azurePackageRepository, timeProvider, freshnessOptions),
            new AwsInventorySecurityBaselineFindingEngine(scopeContextProvider, cloudPackageRepository, timeProvider, freshnessOptions),
            new GcpInventorySecurityBaselineFindingEngine(scopeContextProvider, cloudPackageRepository, timeProvider, freshnessOptions),
            new OpenCommitmentFindingEngine(
                scopeContextProvider,
                reviewTrailRepository,
                riskExceptionService,
                findingInspectReadRepository,
                timeProvider,
                disabledOpenCommitment),
            new SecretsLifecycleFindingEngine(
                scopeContextProvider,
                azurePackageRepository,
                cloudPackageRepository,
                timeProvider,
                freshnessOptions),
            new PortfolioRecurrenceFindingEngine(
                scopeContextProvider,
                disabledPortfolioRecurrence,
                emptyRunScanSource,
                identityMatcher,
                findingEmitter),
        ];
    }

    private sealed class DisabledPortfolioRecurrenceFindingOptionsResolver : IPortfolioRecurrenceFindingOptionsResolver
    {
        public PortfolioRecurrenceFindingOptions Resolve(CancellationToken cancellationToken) =>
            new() { Enabled = false };
    }

    private sealed class EmptyPortfolioRunScanSource : IPortfolioRunScanSource
    {
        public Task<IReadOnlyList<KeyValuePair<string, RunSummary>>> CollectLatestCommittedSystemsAsync(
            int maxSystemsScanned,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<KeyValuePair<string, RunSummary>>>([]);
    }
}
