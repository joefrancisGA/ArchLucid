using System.Linq;

using ArchLucid.Contracts.Common;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Core.Costing;

/// <summary>Computes monthly infrastructure USD totals with optional public pricing API enrichment.</summary>
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
    public Task<InfrastructureCostEstimateTotals> EstimateNodesAsync(
        IReadOnlyList<InfrastructureCostQueryNode> nodes,
        bool attemptRetailPricing,
        AzureRetailPricesCatalogClient? retailPrices,
        CancellationToken cancellationToken)
        => EstimateNodesAsync(
            nodes,
            attemptRetailPricing,
            retailPrices,
            awsPricing: null,
            gcpCatalog: null,
            cancellationToken);

    /// <summary>Computes totals with Azure Retail plus optional AWS Price List and GCP Billing Catalog probes.</summary>
    public async Task<InfrastructureCostEstimateTotals> EstimateNodesAsync(
        IReadOnlyList<InfrastructureCostQueryNode> nodes,
        bool attemptLivePricing,
        AzureRetailPricesCatalogClient? azureRetail,
        AwsPublicPricingClient? awsPricing,
        GcpCloudBillingCatalogClient? gcpCatalog,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        List<InfrastructureCostLine> rows = [];

        bool anyLivePricing = false;

        foreach (InfrastructureCostQueryNode node in nodes)
        {
            cancellationToken.ThrowIfCancellationRequested();

            decimal? monthly = null;

            if (attemptLivePricing)
            {
                monthly = await TryProbeLivePricingAsync(
                        node,
                        azureRetail,
                        awsPricing,
                        gcpCatalog,
                        cancellationToken)
                    .ConfigureAwait(false);
            }

            if (monthly is { } solved)
            {
                rows.Add(ToRetailLine(node, solved));
                anyLivePricing = true;
                continue;
            }

            rows.Add(IllustrativeInfrastructureCostFallback.ToFallbackLine(node));
        }

        decimal total = decimal.Round(rows.Sum(static row => row.EstimatedUsdPerMonth), 2);

        bool everyRetail =
            rows.Count > 0 && rows.TrueForAll(static row => row.PriceSource == InfrastructureCostPriceSource.RetailApi);

        return new InfrastructureCostEstimateTotals(rows.AsReadOnly(), total, anyLivePricing, everyRetail);
    }

    private async Task<decimal?> TryProbeLivePricingAsync(
        InfrastructureCostQueryNode node,
        AzureRetailPricesCatalogClient? azureRetail,
        AwsPublicPricingClient? awsPricing,
        GcpCloudBillingCatalogClient? gcpCatalog,
        CancellationToken cancellationToken)
    {
        CloudProvider family = RuntimePlatformCloudFamily.ResolveCloudFamily(node.Platform);

        try
        {
            if (family == CloudProvider.Aws
                && awsPricing is not null
                && !string.IsNullOrWhiteSpace(node.ArmRegion)
                && !string.IsNullOrWhiteSpace(node.SkuOrTier))
            {
                return await awsPricing.TryGetOnDemandMonthlyUsdAsync(node, cancellationToken).ConfigureAwait(false);
            }

            if (family == CloudProvider.Gcp
                && gcpCatalog is not null
                && !string.IsNullOrWhiteSpace(node.SkuOrTier))
            {
                return await gcpCatalog.TryGetCatalogMonthlyUsdAsync(node, cancellationToken).ConfigureAwait(false);
            }

            if (family == CloudProvider.Azure
                && azureRetail is not null
                && !string.IsNullOrWhiteSpace(node.ArmRegion)
                && !string.IsNullOrWhiteSpace(node.SkuOrTier)
                && InfrastructureCostPricingCatalog.TryGetRetailServiceName(node.Platform, out _))
            {
                return await azureRetail.TryGetConsumptionMonthlyUsdAsync(node, cancellationToken).ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Live pricing probe failed; illustrative fallback.");
        }

        return null;
    }

    internal static InfrastructureCostLine ToRetailLine(InfrastructureCostQueryNode node, decimal retailUsdRounded)
        => new(
            node.LineKind,
            node.DisplayName,
            node.Platform,
            IllustrativeInfrastructureCostFallback.FormatIllustrativeProduct(node.Platform),
            retailUsdRounded,
            InfrastructureCostPriceSource.RetailApi);
}


