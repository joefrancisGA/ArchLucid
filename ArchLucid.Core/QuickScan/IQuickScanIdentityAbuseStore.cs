namespace ArchLucid.Core.QuickScan;

/// <summary>Distributed anonymous Quick Scan identity/abuse counters (TB-897).</summary>
public interface IQuickScanIdentityAbuseStore
{
    Task<QuickScanIdentityAbuseStoreAdmitResult> TryAdmitAsync(
        QuickScanIdentityAbuseStoreAdmitRequest request,
        CancellationToken cancellationToken = default);
}

/// <summary>Atomic admit attempt for layered identity + abuse counters.</summary>
public sealed class QuickScanIdentityAbuseStoreAdmitRequest
{
    public required string SessionHourKey { get; init; }

    public required string SessionDayKey { get; init; }

    public required string BrowserHourKey { get; init; }

    public required string BrowserDayKey { get; init; }

    public required string IpHourKey { get; init; }

    public required string IpDayKey { get; init; }

    public required string IpRangeHourKey { get; init; }

    public required string IpRangeDayKey { get; init; }

    public required string GlobalHourKey { get; init; }

    public required string GlobalDayKey { get; init; }

    public required string BurstMinuteKey { get; init; }

    public required string BurstFiveMinuteKey { get; init; }

    /// <summary>SHA-256 hex of normalized description only — never raw prompt text.</summary>
    public required string ContentHash { get; init; }

    public required DateTimeOffset UtcNow { get; init; }

    public required int DuplicateWindowSeconds { get; init; }

    public required int MaxSessionHour { get; init; }

    public required int MaxSessionDay { get; init; }

    public required int MaxBrowserHour { get; init; }

    public required int MaxBrowserDay { get; init; }

    public required int MaxIpHour { get; init; }

    public required int MaxIpDay { get; init; }

    public required int MaxIpRangeHour { get; init; }

    public required int MaxIpRangeDay { get; init; }

    public required int MaxGlobalHour { get; init; }

    public required int MaxGlobalDay { get; init; }

    public required int MaxBurstMinute { get; init; }

    public required int MaxBurstFiveMinutes { get; init; }

    /// <summary>When &gt; 0 and session day count is at/above this, reject sign-in without incrementing.</summary>
    public required int SignInAfterSessionScans { get; init; }

    /// <summary>When &gt; 0, captcha not satisfied, and session day count is at/above this, reject captcha without incrementing.</summary>
    public required int CaptchaAfterSessionScans { get; init; }

    public required bool CaptchaSatisfied { get; init; }

    /// <summary>When true, evaluate limits without incrementing counters or recording payloads (status probes).</summary>
    public bool DryRun { get; init; }
}

/// <summary>Outcome of <see cref="IQuickScanIdentityAbuseStore.TryAdmitAsync" />.</summary>
public sealed class QuickScanIdentityAbuseStoreAdmitResult
{
    private QuickScanIdentityAbuseStoreAdmitResult(QuickScanIdentityAbuseStoreAdmitOutcome outcome)
    {
        Outcome = outcome;
    }

    public QuickScanIdentityAbuseStoreAdmitOutcome Outcome { get; }

    public static QuickScanIdentityAbuseStoreAdmitResult Admitted() =>
        new(QuickScanIdentityAbuseStoreAdmitOutcome.Admitted);

    public static QuickScanIdentityAbuseStoreAdmitResult RateLimited() =>
        new(QuickScanIdentityAbuseStoreAdmitOutcome.RateLimited);

    public static QuickScanIdentityAbuseStoreAdmitResult Duplicate() =>
        new(QuickScanIdentityAbuseStoreAdmitOutcome.Duplicate);

    public static QuickScanIdentityAbuseStoreAdmitResult Suspicious() =>
        new(QuickScanIdentityAbuseStoreAdmitOutcome.Suspicious);

    public static QuickScanIdentityAbuseStoreAdmitResult SignInRequired() =>
        new(QuickScanIdentityAbuseStoreAdmitOutcome.SignInRequired);

    public static QuickScanIdentityAbuseStoreAdmitResult CaptchaRequired() =>
        new(QuickScanIdentityAbuseStoreAdmitOutcome.CaptchaRequired);
}

public enum QuickScanIdentityAbuseStoreAdmitOutcome : byte
{
    Admitted = 0,
    RateLimited = 1,
    Duplicate = 2,
    Suspicious = 3,
    SignInRequired = 4,
    CaptchaRequired = 5,
}
