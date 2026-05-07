using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Billing;
/// <summary>Rough monthly spend band for operator settings (Standard+ only at the HTTP layer).</summary>
public sealed record TenantCostEstimate(string Currency, TenantTier Tier, decimal EstimatedMonthlyUsdLow, decimal EstimatedMonthlyUsdHigh, IReadOnlyList<string> Factors, string MethodologyNote)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(Currency, Factors, MethodologyNote);
    private static byte __ValidatePrimaryConstructorArguments(System.String currency, System.Collections.Generic.IReadOnlyList<System.String> factors, System.String methodologyNote)
    {
        ArgumentNullException.ThrowIfNull(currency);
        ArgumentNullException.ThrowIfNull(factors);
        ArgumentNullException.ThrowIfNull(methodologyNote);
        return (byte)0;
    }
}