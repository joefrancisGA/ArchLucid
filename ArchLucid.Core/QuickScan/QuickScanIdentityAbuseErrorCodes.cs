namespace ArchLucid.Core.QuickScan;

/// <summary>Stable Problem Details error codes for anonymous Quick Scan identity/abuse limits (TB-897).</summary>
public static class QuickScanIdentityAbuseErrorCodes
{
    public const string RateLimited = "QUICK_SCAN_RATE_LIMITED";

    public const string CaptchaRequired = "QUICK_SCAN_CAPTCHA_REQUIRED";

    public const string SignInRequired = "QUICK_SCAN_SIGN_IN_REQUIRED";

    public const string DuplicateLimit = "QUICK_SCAN_DUPLICATE_LIMIT";

    public const string SuspiciousActivity = "QUICK_SCAN_SUSPICIOUS_ACTIVITY";
}
