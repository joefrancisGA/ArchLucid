using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Core.Costing;

/// <summary>Attempts live Retail API enrichment with bounded backoff to illustrative rows.</summary>
public sealed class RetailInfrastructureCostArtifactAugmentationProvider(
    AzureRetailPricesCatalogClient retailCatalog,
    ILogger<InfrastructureMonthlyUsdCostEstimator> logger)

    : IInfrastructureCostArtifactAugmentationProvider


{
    private readonly AzureRetailPricesCatalogClient _retailCatalog = retailCatalog ?? throw new ArgumentNullException(nameof(retailCatalog));

    private readonly ILogger<InfrastructureMonthlyUsdCostEstimator> _logger = logger ??
                                                                             NullLogger<InfrastructureMonthlyUsdCostEstimator>.Instance;

    /// <inheritdoc />
    public async Task<InfrastructureCostArtifactAugmentation> AugmentNodesAsync(IReadOnlyList<InfrastructureCostQueryNode> nodes,
        CancellationToken cancellationToken)


    {


        InfrastructureMonthlyUsdCostEstimator estimator = new(_logger);

        InfrastructureCostEstimateTotals totals =
            await estimator.EstimateNodesAsync(nodes,

                attemptRetailPricing: true,
                _retailCatalog,
                cancellationToken).ConfigureAwait(false);

        string summary = totals.TotalUsdPerMonth <= 0m

            ?
            "No billable topology rows surfaced for sizing."
            :

            totals.AllRetailPricing

                ?

                "Azure Retail Prices API sizing (consumption assumptions; see line-level price sources)."
                :

                "Blend of Retail API matches and illustrative fallbacks (consumption SKU/region probes do not guarantee agreement with your bill).";

        return new InfrastructureCostArtifactAugmentation(decimal.Round(totals.TotalUsdPerMonth,

                2),

            totals.Lines,
            summary);

    }



}
