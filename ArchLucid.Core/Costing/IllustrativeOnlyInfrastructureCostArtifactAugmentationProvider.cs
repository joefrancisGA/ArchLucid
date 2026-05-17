using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Core.Costing;

/// <summary>Illustrative-only augmentation suitable for deterministic tests/offline synthesis.</summary>
public sealed class IllustrativeOnlyInfrastructureCostArtifactAugmentationProvider(ILogger<InfrastructureMonthlyUsdCostEstimator>? logger)
    : IInfrastructureCostArtifactAugmentationProvider

{
    private readonly InfrastructureMonthlyUsdCostEstimator _estimator =


        new(logger ?? NullLogger<InfrastructureMonthlyUsdCostEstimator>.Instance);


    /// <inheritdoc />
    public async Task<InfrastructureCostArtifactAugmentation> AugmentNodesAsync(IReadOnlyList<InfrastructureCostQueryNode> nodes,
        CancellationToken cancellationToken)


    {


        InfrastructureCostEstimateTotals totals =
            await _estimator.EstimateNodesAsync(nodes,

                attemptRetailPricing: false,
                retailPrices: null,
                cancellationToken).ConfigureAwait(false);

        static string ComposeNote(InfrastructureCostEstimateTotals t)


            =>
                t.TotalUsdPerMonth <= 0m

                    ?
                    "No billable topology rows surfaced for illustrative costing."
                    :

                    "Illustrative infrastructure USD/month (Retail API probing disabled).";

        return new InfrastructureCostArtifactAugmentation(decimal.Round(totals.TotalUsdPerMonth,

                2),
            totals.Lines,
            ComposeNote(totals));

    }

}
