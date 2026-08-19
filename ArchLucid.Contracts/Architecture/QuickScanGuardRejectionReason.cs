namespace ArchLucid.Contracts.Architecture;

/// <summary>Why a Quick Scan request was rejected before model execution.</summary>
public enum QuickScanGuardRejectionReason
{
    Disabled,
    GlobalHourlyRequestLimit,
    GlobalDailyRequestLimit,
    GlobalHourlySpendCeiling,
    GlobalDailySpendCeiling,
    PerIpHourlyLimit,
    PerIpDailyLimit,
    PerSessionDailyLimit,
    ConcurrentScanLimit,
    SignInRequired,
    DuplicatePayload,
    CaptchaRequired,
    SuspiciousActivity,
}
