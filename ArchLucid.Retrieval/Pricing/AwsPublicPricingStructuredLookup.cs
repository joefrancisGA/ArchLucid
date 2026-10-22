using ArchLucid.Core.Costing;

namespace ArchLucid.Retrieval.Pricing;

/// <summary>
///     Production <see cref="IAwsRetailPriceStructuredLookup" /> backed by
///     <see cref="AwsPublicPricingClient" /> (TB-603).
/// </summary>
public sealed class AwsPublicPricingStructuredLookup(AwsPublicPricingClient pricingClient) : IAwsRetailPriceStructuredLookup
{
    private readonly AwsPublicPricingClient _pricingClient =
        pricingClient ?? throw new ArgumentNullException(nameof(pricingClient));

    /// <inheritdoc />
    public bool TryLookup(string serviceName, string region, string? instanceType, out AwsRetailPriceRow row)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceName);
        ArgumentException.ThrowIfNullOrWhiteSpace(region);

        if (string.IsNullOrWhiteSpace(instanceType))
        {
            row = null!;
            return false;
        }

        decimal? monthlyUsd = _pricingClient
            .TryGetEc2OnDemandMonthlyUsdAsync(region, instanceType, 1, CancellationToken.None)
            .GetAwaiter()
            .GetResult();

        if (monthlyUsd is null or <= 0m)
        {
            if (!AwsRetailPricesHeuristicFallback.TryGetMonthlyUsd(serviceName, instanceType, out decimal heuristicMonthlyUsd))
            {
                row = null!;
                return false;
            }

            row = new AwsRetailPriceRow(
                serviceName,
                region,
                instanceType,
                heuristicMonthlyUsd,
                "USD",
                IsHeuristicFallback: true);

            return true;
        }

        row = new AwsRetailPriceRow(
            serviceName,
            region,
            instanceType,
            monthlyUsd.Value,
            "USD");

        return true;
    }

    /// <inheritdoc />
    public string FormatForPrompt(AwsRetailPriceRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        string prefix = row.IsHeuristicFallback ? "[Fallback Estimate] " : string.Empty;

        return prefix +
               $"AWS Price List row: service={row.ServiceName}; region={row.Region}; instanceType={row.InstanceType}; estimatedMonthlyUsd={row.EstimatedMonthlyUsd:0.####} {row.CurrencyCode}";
    }
}
