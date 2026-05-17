using System.Linq;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Core.Costing;

/// <summary>Computes monthly infrastructure USD totals with optional Azure Retail enrichment.</summary>
public sealed class InfrastructureMonthlyUsdCostEstimator
{
    private readonly ILogger _logger;

    /// <summary>Produces estimator rows leveraging optional Retail API access.</summary>
    public InfrastructureMonthlyUsdCostEstimator(ILogger? logger)

    {


        _logger = logger ?? NullLogger.Instance;


    }



    /// <param name="nodes">Workload rows produced from manifests or extractor inventory.</param>
    /// <param name="attemptRetailPricing">
    ///     When <see langword="true" /> with a non-null <paramref name="retailPrices"/>, SKU/region rows attempt live Retail probing.
    /// </param>
    public async Task<InfrastructureCostEstimateTotals> EstimateNodesAsync(IReadOnlyList<InfrastructureCostQueryNode> nodes,
        bool attemptRetailPricing,

        AzureRetailPricesCatalogClient? retailPrices,

        CancellationToken cancellationToken)


    {


        cancellationToken.ThrowIfCancellationRequested();

        List<InfrastructureCostLine> rows = [];

        bool anyRetail = false;


        foreach (InfrastructureCostQueryNode node in nodes)

        {


            cancellationToken.ThrowIfCancellationRequested();


            bool canRetail = attemptRetailPricing && retailPrices is not null &&

                             !string.IsNullOrWhiteSpace(node.ArmRegion) &&


                             !string.IsNullOrWhiteSpace(node.SkuOrTier) &&
                             InfrastructureCostPricingCatalog.TryGetRetailServiceName(node.Platform, out _);

            if (!canRetail)


            {


                rows.Add(IllustrativeInfrastructureCostFallback.ToFallbackLine(node));

                continue;


            }



            decimal? monthly;


            try

            {


                monthly = await retailPrices!.TryGetConsumptionMonthlyUsdAsync(node, cancellationToken).ConfigureAwait(false);

            }


            catch (Exception ex)

            {


                monthly = null;

                _logger.LogDebug(ex,

                    "Retail probing failed per node; illustrative fallback.");

            }



            if (monthly is { } solved)


            {


                rows.Add(ToRetailLine(node,

                    solved));

                anyRetail = true;

                continue;

            }



            rows.Add(IllustrativeInfrastructureCostFallback.ToFallbackLine(node));

        }



        decimal total = decimal.Round(rows.Sum(static row => row.EstimatedUsdPerMonth),

            2);

        bool everyRetail =
            rows.Count > 0 && rows.TrueForAll(static row => row.PriceSource == InfrastructureCostPriceSource.RetailApi);

        return new InfrastructureCostEstimateTotals(rows.AsReadOnly(),



            total,

            anyRetail,

            everyRetail);


    }



    internal static InfrastructureCostLine ToRetailLine(InfrastructureCostQueryNode node,

        decimal retailUsdRounded)
        =>
            new InfrastructureCostLine(node.LineKind, node.DisplayName, node.Platform,

                IllustrativeInfrastructureCostFallback.FormatIllustrativeAzureProduct(node.Platform),

                retailUsdRounded, InfrastructureCostPriceSource.RetailApi);


}


