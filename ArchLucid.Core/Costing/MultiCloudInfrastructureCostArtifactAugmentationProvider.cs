using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Core.Costing;

/// <summary>Attempts live public pricing APIs (Azure Retail, AWS Price List, GCP Billing Catalog) with illustrative fallback.</summary>
public sealed class MultiCloudInfrastructureCostArtifactAugmentationProvider(
    AzureRetailPricesCatalogClient azureRetailCatalog,
    AwsPublicPricingClient awsPricingClient,
    GcpCloudBillingCatalogClient gcpCatalogClient,
    ILogger<InfrastructureMonthlyUsdCostEstimator> logger)
    : IInfrastructureCostArtifactAugmentationProvider
{
    private readonly AzureRetailPricesCatalogClient _azureRetailCatalog =
        azureRetailCatalog ?? throw new ArgumentNullException(nameof(azureRetailCatalog));

    private readonly AwsPublicPricingClient _awsPricingClient =
        awsPricingClient ?? throw new ArgumentNullException(nameof(awsPricingClient));

    private readonly GcpCloudBillingCatalogClient _gcpCatalogClient =
        gcpCatalogClient ?? throw new ArgumentNullException(nameof(gcpCatalogClient));

    private readonly ILogger<InfrastructureMonthlyUsdCostEstimator> _logger = logger ??
        NullLogger<InfrastructureMonthlyUsdCostEstimator>.Instance;

    /// <inheritdoc />
    public async Task<InfrastructureCostArtifactAugmentation> AugmentNodesAsync(
        IReadOnlyList<InfrastructureCostQueryNode> nodes,
        CancellationToken cancellationToken)
    {
        InfrastructureMonthlyUsdCostEstimator estimator = new(_logger);

        InfrastructureCostEstimateTotals totals = await estimator.EstimateNodesAsync(
            nodes,
            attemptLivePricing: true,
            _azureRetailCatalog,
            _awsPricingClient,
            _gcpCatalogClient,
            cancellationToken).ConfigureAwait(false);

        return new InfrastructureCostArtifactAugmentation(
            decimal.Round(totals.TotalUsdPerMonth, 2),
            totals.Lines,
            InfrastructureCostSummaryNotes.ComposeRetailBlendNote(totals));
    }
}
