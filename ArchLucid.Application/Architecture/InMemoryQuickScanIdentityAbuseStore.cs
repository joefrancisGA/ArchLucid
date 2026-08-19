using ArchLucid.Core.QuickScan;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Process-wide in-memory identity/abuse store for simulator/tests (TB-897).
///     Production-like hosts must use the SQL implementation — this is not shared across instances.
/// </summary>
public sealed class InMemoryQuickScanIdentityAbuseStore : IQuickScanIdentityAbuseStore
{
    private readonly object _sync = new();

    private readonly Dictionary<string, int> _counters = new(StringComparer.Ordinal);

    private readonly Dictionary<string, DateTimeOffset> _payloads = new(StringComparer.Ordinal);

    /// <inheritdoc />
    public Task<QuickScanIdentityAbuseStoreAdmitResult> TryAdmitAsync(
        QuickScanIdentityAbuseStoreAdmitRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        lock (_sync)
        {
            PrunePayloads(request.UtcNow, request.DuplicateWindowSeconds);

            if (IsDuplicate(request.ContentHash, request.UtcNow, request.DuplicateWindowSeconds))
                return Task.FromResult(QuickScanIdentityAbuseStoreAdmitResult.Duplicate());

            if (GetCount(request.BurstMinuteKey) >= request.MaxBurstMinute
                || GetCount(request.BurstFiveMinuteKey) >= request.MaxBurstFiveMinutes)
            {
                return Task.FromResult(QuickScanIdentityAbuseStoreAdmitResult.Suspicious());
            }

            int sessionDayCount = GetCount(request.SessionDayKey);

            if (request.SignInAfterSessionScans > 0 && sessionDayCount >= request.SignInAfterSessionScans)
                return Task.FromResult(QuickScanIdentityAbuseStoreAdmitResult.SignInRequired());

            if (request.CaptchaAfterSessionScans > 0
                && !request.CaptchaSatisfied
                && sessionDayCount >= request.CaptchaAfterSessionScans)
            {
                return Task.FromResult(QuickScanIdentityAbuseStoreAdmitResult.CaptchaRequired());
            }

            if (GetCount(request.SessionHourKey) >= request.MaxSessionHour
                || sessionDayCount >= request.MaxSessionDay
                || GetCount(request.BrowserHourKey) >= request.MaxBrowserHour
                || GetCount(request.BrowserDayKey) >= request.MaxBrowserDay
                || GetCount(request.IpHourKey) >= request.MaxIpHour
                || GetCount(request.IpDayKey) >= request.MaxIpDay
                || GetCount(request.IpRangeHourKey) >= request.MaxIpRangeHour
                || GetCount(request.IpRangeDayKey) >= request.MaxIpRangeDay
                || GetCount(request.GlobalHourKey) >= request.MaxGlobalHour
                || GetCount(request.GlobalDayKey) >= request.MaxGlobalDay)
            {
                return Task.FromResult(QuickScanIdentityAbuseStoreAdmitResult.RateLimited());
            }

            if (request.DryRun)
                return Task.FromResult(QuickScanIdentityAbuseStoreAdmitResult.Admitted());

            Increment(request.SessionHourKey);
            Increment(request.SessionDayKey);
            Increment(request.BrowserHourKey);
            Increment(request.BrowserDayKey);
            Increment(request.IpHourKey);
            Increment(request.IpDayKey);
            Increment(request.IpRangeHourKey);
            Increment(request.IpRangeDayKey);
            Increment(request.GlobalHourKey);
            Increment(request.GlobalDayKey);
            Increment(request.BurstMinuteKey);
            Increment(request.BurstFiveMinuteKey);
            _payloads[request.ContentHash] = request.UtcNow;

            return Task.FromResult(QuickScanIdentityAbuseStoreAdmitResult.Admitted());
        }
    }

    private bool IsDuplicate(string contentHash, DateTimeOffset utcNow, int windowSeconds)
    {
        if (string.IsNullOrWhiteSpace(contentHash) || windowSeconds <= 0)
            return false;

        if (!_payloads.TryGetValue(contentHash, out DateTimeOffset seenAt))
            return false;

        return utcNow - seenAt < TimeSpan.FromSeconds(windowSeconds);
    }

    private void PrunePayloads(DateTimeOffset utcNow, int windowSeconds)
    {
        int retainSeconds = Math.Max(windowSeconds, 60) * 2;
        List<string> expired = _payloads
            .Where(pair => utcNow - pair.Value > TimeSpan.FromSeconds(retainSeconds))
            .Select(pair => pair.Key)
            .ToList();

        foreach (string key in expired)
            _payloads.Remove(key);
    }

    private int GetCount(string key) =>
        _counters.TryGetValue(key, out int value) ? value : 0;

    private void Increment(string key)
    {
        if (!_counters.TryGetValue(key, out int value))
        {
            _counters[key] = 1;
            return;
        }

        _counters[key] = value + 1;
    }
}
