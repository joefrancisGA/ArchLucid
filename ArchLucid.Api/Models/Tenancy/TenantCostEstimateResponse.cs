using ArchLucid.Application.Billing;

namespace ArchLucid.Api.Models.Tenancy;

/// <summary>HTTP projection of <see cref="TenantCostEstimate"/>.</summary>
public sealed class TenantCostEstimateResponse
{
    public string Currency { get; init; } = "USD";

    public string Tier { get; init; } = "";

    public decimal EstimatedMonthlyUsdLow { get; init; }

    public decimal EstimatedMonthlyUsdHigh { get; init; }

    public IReadOnlyList<string> Factors { get; init; } = [];

    public string MethodologyNote { get; init; } = "";

    public static TenantCostEstimateResponse FromDomain(TenantCostEstimate estimate) => new()
    {
        Currency = estimate.Currency,
        Tier = estimate.Tier.ToString(),
        EstimatedMonthlyUsdLow = estimate.EstimatedMonthlyUsdLow,
        EstimatedMonthlyUsdHigh = estimate.EstimatedMonthlyUsdHigh,
        Factors = estimate.Factors,
        MethodologyNote = estimate.MethodologyNote,
    };
}
