using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Architecture;

/// <summary>Admits anonymous Quick Scan requests against layered identity/abuse limits (TB-897).</summary>
public interface IQuickScanIdentityAbuseService
{
    Task<QuickScanIdentityAbuseDecision> TryAdmitAsync(
        QuickScanIdentityAbuseAdmitContext context,
        CancellationToken cancellationToken = default);

    /// <summary>Evaluates limits without consuming counters (marketing status probes).</summary>
    Task<QuickScanIdentityAbuseDecision> EvaluateAsync(
        QuickScanIdentityAbuseAdmitContext context,
        CancellationToken cancellationToken = default);
}

public sealed class QuickScanIdentityAbuseAdmitContext
{
    public required string ClientIp { get; init; }

    public required string SessionId { get; init; }

    public required string BrowserId { get; init; }

    public required string Description { get; init; }

    public string? BotChallengeToken { get; init; }
}

public sealed class QuickScanIdentityAbuseDecision
{
    private QuickScanIdentityAbuseDecision(bool allowed, QuickScanGuardRejectionReason? rejectionReason)
    {
        Allowed = allowed;
        RejectionReason = rejectionReason;
    }

    public bool Allowed { get; }

    public QuickScanGuardRejectionReason? RejectionReason { get; }

    public static QuickScanIdentityAbuseDecision Permit() => new(true, null);

    public static QuickScanIdentityAbuseDecision Reject(QuickScanGuardRejectionReason reason) =>
        new(false, reason);
}

/// <inheritdoc cref="IQuickScanIdentityAbuseService" />
public sealed class QuickScanIdentityAbuseService(
    IQuickScanIdentityAbuseStore store,
    IOptionsMonitor<QuickScanSafetyOptions> safetyOptions,
    IQuickScanBotChallengeVerifier botChallengeVerifier,
    TimeProvider timeProvider) : IQuickScanIdentityAbuseService
{
    private readonly IQuickScanIdentityAbuseStore _store =
        store ?? throw new ArgumentNullException(nameof(store));

    private readonly IOptionsMonitor<QuickScanSafetyOptions> _safetyOptions =
        safetyOptions ?? throw new ArgumentNullException(nameof(safetyOptions));

    private readonly IQuickScanBotChallengeVerifier _botChallengeVerifier =
        botChallengeVerifier ?? throw new ArgumentNullException(nameof(botChallengeVerifier));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public Task<QuickScanIdentityAbuseDecision> TryAdmitAsync(
        QuickScanIdentityAbuseAdmitContext context,
        CancellationToken cancellationToken = default) =>
        EvaluateCoreAsync(context, dryRun: false, cancellationToken);

    /// <inheritdoc />
    public Task<QuickScanIdentityAbuseDecision> EvaluateAsync(
        QuickScanIdentityAbuseAdmitContext context,
        CancellationToken cancellationToken = default) =>
        EvaluateCoreAsync(context, dryRun: true, cancellationToken);

    private async Task<QuickScanIdentityAbuseDecision> EvaluateCoreAsync(
        QuickScanIdentityAbuseAdmitContext context,
        bool dryRun,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        QuickScanSafetyOptions safety = _safetyOptions.CurrentValue;

        if (!safety.Enabled)
            return QuickScanIdentityAbuseDecision.Permit();

        DateTimeOffset utcNow = _timeProvider.GetUtcNow();
        string hourBucket = utcNow.ToString("yyyyMMddHH", System.Globalization.CultureInfo.InvariantCulture);
        string dayBucket = utcNow.ToString("yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);
        string minuteBucket = utcNow.ToString("yyyyMMddHHmm", System.Globalization.CultureInfo.InvariantCulture);
        string fiveMinuteBucket = BuildFiveMinuteBucket(utcNow);

        string sessionHash = QuickScanIdentityKeyMaterial.HashIdentity(context.SessionId);
        string browserHash = QuickScanIdentityKeyMaterial.HashIdentity(context.BrowserId);
        string ipHash = QuickScanIdentityKeyMaterial.HashIdentity(context.ClientIp);
        string ipRangeHash = QuickScanIdentityKeyMaterial.HashIdentity(
            QuickScanIdentityKeyMaterial.NormalizeIpRange(context.ClientIp));
        string contentHash = QuickScanContentFingerprint.Compute(context.Description);

        bool captchaSatisfied = false;

        if (safety.ProgressiveFriction.CaptchaEnabled)
        {
            captchaSatisfied = await _botChallengeVerifier
                .VerifyAsync(context.BotChallengeToken, cancellationToken)
                .ConfigureAwait(false);
        }

        int signInAfter = safety.ProgressiveFriction.SignInFrictionEnabled
            ? safety.ProgressiveFriction.ScansBeforeSignInRequired
            : 0;

        int captchaAfter = safety.ProgressiveFriction.CaptchaEnabled
            ? safety.ProgressiveFriction.ScansBeforeCaptchaRequired
            : 0;

        QuickScanIdentityAbuseStoreAdmitRequest request = new()
        {
            SessionHourKey = QuickScanIdentityKeyMaterial.BuildCounterKey("sh", sessionHash, hourBucket),
            SessionDayKey = QuickScanIdentityKeyMaterial.BuildCounterKey("sd", sessionHash, dayBucket),
            BrowserHourKey = QuickScanIdentityKeyMaterial.BuildCounterKey("bh", browserHash, hourBucket),
            BrowserDayKey = QuickScanIdentityKeyMaterial.BuildCounterKey("bd", browserHash, dayBucket),
            IpHourKey = QuickScanIdentityKeyMaterial.BuildCounterKey("ih", ipHash, hourBucket),
            IpDayKey = QuickScanIdentityKeyMaterial.BuildCounterKey("id", ipHash, dayBucket),
            IpRangeHourKey = QuickScanIdentityKeyMaterial.BuildCounterKey("rh", ipRangeHash, hourBucket),
            IpRangeDayKey = QuickScanIdentityKeyMaterial.BuildCounterKey("rd", ipRangeHash, dayBucket),
            GlobalHourKey = QuickScanIdentityKeyMaterial.BuildCounterKey("gh", "global", hourBucket),
            GlobalDayKey = QuickScanIdentityKeyMaterial.BuildCounterKey("gd", "global", dayBucket),
            BurstMinuteKey = QuickScanIdentityKeyMaterial.BuildCounterKey("bm", ipHash, minuteBucket),
            BurstFiveMinuteKey = QuickScanIdentityKeyMaterial.BuildCounterKey("b5", ipHash, fiveMinuteBucket),
            ContentHash = contentHash,
            UtcNow = utcNow,
            DuplicateWindowSeconds = safety.Abuse.DuplicateDetectionWindowSeconds,
            MaxSessionHour = safety.Identity.MaxScansPerSessionPerHour,
            MaxSessionDay = safety.Identity.MaxScansPerSessionPerDay,
            MaxBrowserHour = safety.Identity.MaxScansPerBrowserPerHour,
            MaxBrowserDay = safety.Identity.MaxScansPerBrowserPerDay,
            MaxIpHour = safety.Identity.MaxScansPerIpPerHour,
            MaxIpDay = safety.Identity.MaxScansPerIpPerDay,
            MaxIpRangeHour = safety.Identity.MaxScansPerIpRangePerHour,
            MaxIpRangeDay = safety.Identity.MaxScansPerIpRangePerDay,
            MaxGlobalHour = safety.GlobalRequests.MaxAnonymousRequestsPerHour,
            MaxGlobalDay = safety.GlobalRequests.MaxAnonymousRequestsPerDay,
            MaxBurstMinute = safety.Abuse.BurstRequestsPerMinuteThreshold,
            MaxBurstFiveMinutes = safety.Abuse.BurstRequestsPerFiveMinutesThreshold,
            SignInAfterSessionScans = signInAfter,
            CaptchaAfterSessionScans = captchaAfter,
            CaptchaSatisfied = captchaSatisfied,
            DryRun = dryRun,
        };

        AssertNoRawDescriptionInKeys(request, context.Description);

        QuickScanIdentityAbuseStoreAdmitResult result =
            await _store.TryAdmitAsync(request, cancellationToken).ConfigureAwait(false);

        return result.Outcome switch
        {
            QuickScanIdentityAbuseStoreAdmitOutcome.Admitted => QuickScanIdentityAbuseDecision.Permit(),
            QuickScanIdentityAbuseStoreAdmitOutcome.Duplicate =>
                QuickScanIdentityAbuseDecision.Reject(QuickScanGuardRejectionReason.DuplicatePayload),
            QuickScanIdentityAbuseStoreAdmitOutcome.Suspicious =>
                QuickScanIdentityAbuseDecision.Reject(QuickScanGuardRejectionReason.SuspiciousActivity),
            QuickScanIdentityAbuseStoreAdmitOutcome.SignInRequired =>
                QuickScanIdentityAbuseDecision.Reject(QuickScanGuardRejectionReason.SignInRequired),
            QuickScanIdentityAbuseStoreAdmitOutcome.CaptchaRequired =>
                QuickScanIdentityAbuseDecision.Reject(QuickScanGuardRejectionReason.CaptchaRequired),
            QuickScanIdentityAbuseStoreAdmitOutcome.RateLimited =>
                QuickScanIdentityAbuseDecision.Reject(QuickScanGuardRejectionReason.PerIpHourlyLimit),
            _ => QuickScanIdentityAbuseDecision.Reject(QuickScanGuardRejectionReason.SuspiciousActivity),
        };
    }

    private static string BuildFiveMinuteBucket(DateTimeOffset utcNow)
    {
        int flooredMinute = (utcNow.Minute / 5) * 5;

        return utcNow.ToString("yyyyMMddHH", System.Globalization.CultureInfo.InvariantCulture)
               + flooredMinute.ToString("00", System.Globalization.CultureInfo.InvariantCulture);
    }

    private static void AssertNoRawDescriptionInKeys(
        QuickScanIdentityAbuseStoreAdmitRequest request,
        string description)
    {
        string trimmed = description.Trim();

        if (trimmed.Length < 6)
            return;

        string[] keys =
        [
            request.SessionHourKey,
            request.SessionDayKey,
            request.BrowserHourKey,
            request.BrowserDayKey,
            request.IpHourKey,
            request.IpDayKey,
            request.IpRangeHourKey,
            request.IpRangeDayKey,
            request.GlobalHourKey,
            request.GlobalDayKey,
            request.BurstMinuteKey,
            request.BurstFiveMinuteKey,
            request.ContentHash,
        ];

        foreach (string key in keys)
        {
            if (key.Contains(trimmed, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Quick Scan identity abuse keys must not contain raw description text.");
            }
        }
    }
}
