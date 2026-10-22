using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Architecture;

/// <summary>Outcome of a Quick Scan execution attempt (TB-895).</summary>
public sealed class QuickScanExecutionResult
{
    private QuickScanExecutionResult(
        ArchitectureQuickScanResponse? successBody,
        QuickScanExecutionFailureKind? failureKind,
        QuickScanGuardRejectionReason? guardRejectionReason,
        QuickScanConcurrencyRejectionReason? concurrencyRejectionReason,
        string? validationDetail)
    {
        SuccessBody = successBody;
        FailureKind = failureKind;
        GuardRejectionReason = guardRejectionReason;
        ConcurrencyRejectionReason = concurrencyRejectionReason;
        ValidationDetail = validationDetail;
    }

    public ArchitectureQuickScanResponse? SuccessBody { get; }

    public QuickScanExecutionFailureKind? FailureKind { get; }

    public QuickScanGuardRejectionReason? GuardRejectionReason { get; }

    public QuickScanConcurrencyRejectionReason? ConcurrencyRejectionReason { get; }

    public string? ValidationDetail { get; }

    public bool Succeeded => SuccessBody is not null;

    public static QuickScanExecutionResult Success(ArchitectureQuickScanResponse body) =>
        new(body, null, null, null, null);

    public static QuickScanExecutionResult ValidationFailed(string detail) =>
        new(null, QuickScanExecutionFailureKind.Validation, null, null, detail);

    public static QuickScanExecutionResult GuardRejected(QuickScanGuardRejectionReason reason) =>
        new(null, QuickScanExecutionFailureKind.GuardRejected, reason, null, null);

    public static QuickScanExecutionResult ConcurrencyRejected(QuickScanConcurrencyRejectionReason reason) =>
        new(null, QuickScanExecutionFailureKind.ConcurrencyRejected, null, reason, null);

    public static QuickScanExecutionResult CapacityReached() =>
        new(null, QuickScanExecutionFailureKind.CapacityReached, null, null, null);

    public static QuickScanExecutionResult EmergencyDisabled(string message) =>
        new(null, QuickScanExecutionFailureKind.EmergencyDisabled, null, null, message);

    public static QuickScanExecutionResult ExecutionFailed() =>
        new(null, QuickScanExecutionFailureKind.ExecutionFailed, null, null, null);
}

/// <summary>Failure categories mapped to HTTP responses in API controllers.</summary>
public enum QuickScanExecutionFailureKind
{
    Validation,
    GuardRejected,
    ConcurrencyRejected,
    EmergencyDisabled,
    CapacityReached,
    ExecutionFailed,
}
