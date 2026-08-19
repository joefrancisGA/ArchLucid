namespace ArchLucid.Core.Configuration;

/// <summary>Outcome of a Quick Scan pre-execution cost reservation attempt.</summary>
public sealed class QuickScanCostEstimateResult
{
    private QuickScanCostEstimateResult(bool allowed, QuickScanReservedCostBreakdown? reservation, QuickScanCostEstimateRejectionReason? rejectionReason)
    {
        Allowed = allowed;
        Reservation = reservation;
        RejectionReason = rejectionReason;
    }

    public bool Allowed { get; }

    public QuickScanReservedCostBreakdown? Reservation { get; }

    public QuickScanCostEstimateRejectionReason? RejectionReason { get; }

    public static QuickScanCostEstimateResult Permit(QuickScanReservedCostBreakdown reservation) =>
        new(true, reservation, null);

    public static QuickScanCostEstimateResult Reject(QuickScanCostEstimateRejectionReason reason) =>
        new(false, null, reason);
}
