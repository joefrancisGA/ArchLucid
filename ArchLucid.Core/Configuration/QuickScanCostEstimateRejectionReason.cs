namespace ArchLucid.Core.Configuration;

/// <summary>Why a Quick Scan pre-execution cost reservation was rejected.</summary>
public enum QuickScanCostEstimateRejectionReason
{
    UnknownModel,
    UnapprovedModel,
    InactiveModel,
    StalePricing,
    UnsupportedCurrency,
    OverUnitPriceCap,
    OverPerRequestBudget,
    TokenEstimateUnsafe,
    EstimationFailed,
    ClientModelOverrideRejected,
}
