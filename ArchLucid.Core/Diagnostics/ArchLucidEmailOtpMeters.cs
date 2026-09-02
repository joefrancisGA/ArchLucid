using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

public static partial class ArchLucidGrowthFunnelMeters
{
    /// <summary>Email OTP challenge requests (labels: <c>result</c>).</summary>
    public static readonly Counter<long> EmailOtpChallengeRequestedTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_email_otp_challenge_requested_total",
            description: "Email OTP challenge requests (label result=accepted|rate_limited|sso_required|disabled|invalid_email|bot_challenge_failed).");

    /// <summary>Email OTP verify attempts (labels: <c>result</c>).</summary>
    public static readonly Counter<long> EmailOtpChallengeVerifiedTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_email_otp_challenge_verified_total",
            description: "Email OTP verify attempts (label result=success|invalid|expired|rate_limited|sso_required).");

    /// <summary>Email OTP outbound delivery failures.</summary>
    public static readonly Counter<long> EmailOtpDeliveryFailedTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_email_otp_delivery_failed_total",
            description: "Email OTP sign-in code delivery failures.");

    /// <summary>Email OTP rate-limit triggers (labels: <c>scope</c>=email|ip|email_verification_hourly).</summary>
    public static readonly Counter<long> EmailOtpRateLimitTriggeredTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_email_otp_rate_limit_triggered_total",
            description: "Email OTP rate-limit triggers (label scope).");

    /// <summary>Increments <see cref="EmailOtpChallengeRequestedTotal" />.</summary>
    public static void RecordEmailOtpChallengeRequested(string result)
    {
        TagList tags = new() { { "result", NormalizeEmailOtpChallengeResult(result) } };

        EmailOtpChallengeRequestedTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="EmailOtpChallengeVerifiedTotal" />.</summary>
    public static void RecordEmailOtpChallengeVerified(string result)
    {
        TagList tags = new() { { "result", NormalizeEmailOtpVerifyResult(result) } };

        EmailOtpChallengeVerifiedTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="EmailOtpDeliveryFailedTotal" />.</summary>
    public static void RecordEmailOtpDeliveryFailed()
    {
        EmailOtpDeliveryFailedTotal.Add(1);
    }

    /// <summary>Increments <see cref="EmailOtpRateLimitTriggeredTotal" />.</summary>
    public static void RecordEmailOtpRateLimitTriggered(string scope)
    {
        TagList tags = new() { { "scope", string.IsNullOrWhiteSpace(scope) ? "unknown" : scope.Trim() } };

        EmailOtpRateLimitTriggeredTotal.Add(1, tags);
    }

    private static string NormalizeEmailOtpChallengeResult(string result)
    {
        string r = string.IsNullOrWhiteSpace(result) ? "unknown" : result.Trim();

        return r switch
        {
            "accepted" or "rate_limited" or "sso_required" or "disabled" or "invalid_email" or "bot_challenge_failed" => r,
            _ => "unknown"
        };
    }

    private static string NormalizeEmailOtpVerifyResult(string result)
    {
        string r = string.IsNullOrWhiteSpace(result) ? "unknown" : result.Trim();

        return r switch
        {
            "success" or "invalid" or "expired" or "rate_limited" or "sso_required" => r,
            _ => "invalid"
        };
    }
}
