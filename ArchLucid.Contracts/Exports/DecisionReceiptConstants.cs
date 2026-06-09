namespace ArchLucid.Contracts.Exports;

/// <summary>Shared decision receipt schema and labeling constants (ADR 0052 / SAQ-011).</summary>
public static class DecisionReceiptConstants
{
    public const string SchemaVersion = "archlucid.decision-receipt.v1";

    /// <summary>SAQ-011 — cost figures are estimates, not audited financial advice.</summary>
    public const string CostEstimateLabel = "Estimated — not audited financial advice (SAQ-011)";
}
