using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Architecture;

/// <summary>Pre-execution conservative Quick Scan cost reservation (TB-893).</summary>
public interface IQuickScanCostEstimator
{
    QuickScanCostEstimateResult TryReserveCost(
        QuickScanRequestValidator.ValidatedQuickScanRequest validated,
        string? clientRequestedModelId,
        DateTimeOffset utcNow);
}
