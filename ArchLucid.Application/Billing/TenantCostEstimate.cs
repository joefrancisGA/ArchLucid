using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Billing;

/// <summary>Rough monthly spend band for operator settings (Standard+ only at the HTTP layer).</summary>
public sealed record TenantCostEstimate(
    string Currency,
    TenantTier Tier,
    decimal EstimatedMonthlyUsdLow,
    decimal EstimatedMonthlyUsdHigh,
    IReadOnlyList<string> Factors,
    string MethodologyNote);
