using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Architecture;

/// <summary>Enforces anonymous Quick Scan cost and abuse limits server-side.</summary>
public interface IQuickScanGuard
{
    QuickScanGuardDecision TryBeginScan(QuickScanGuardContext context);

    void RecordScanStarted(QuickScanGuardContext context);

    void RecordScanCompleted(
        QuickScanGuardContext context,
        bool succeeded,
        decimal estimatedCostUsd,
        int inputTokens,
        int outputTokens,
        TimeSpan duration);

    void RecordRejection(QuickScanGuardContext context, QuickScanGuardRejectionReason reason);

    QuickScanStatusResponse GetStatus(QuickScanGuardContext context);
}

/// <inheritdoc cref="IQuickScanGuard" />
public sealed class QuickScanGuard(IOptionsMonitor<QuickScanOptions> optionsMonitor, TimeProvider timeProvider) : IQuickScanGuard
{
    private readonly object _globalLock = new();
    private readonly Dictionary<string, PeriodCounter> _globalHourlyRequests = new(StringComparer.Ordinal);
    private readonly Dictionary<string, PeriodCounter> _globalDailyRequests = new(StringComparer.Ordinal);
    private readonly Dictionary<string, decimal> _globalHourlySpend = new(StringComparer.Ordinal);
    private readonly Dictionary<string, decimal> _globalDailySpend = new(StringComparer.Ordinal);
    private readonly Dictionary<string, PeriodCounter> _ipHourly = new(StringComparer.Ordinal);
    private readonly Dictionary<string, PeriodCounter> _ipDaily = new(StringComparer.Ordinal);
    private readonly Dictionary<string, PeriodCounter> _sessionDaily = new(StringComparer.Ordinal);
    private readonly Dictionary<string, DateTimeOffset> _recentPayloads = new(StringComparer.Ordinal);
    private int _concurrentScans;

    public QuickScanGuardDecision TryBeginScan(QuickScanGuardContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        QuickScanOptions options = optionsMonitor.CurrentValue;

        if (!options.Enabled)
            return QuickScanGuardDecision.Reject(QuickScanGuardRejectionReason.Disabled);

        DateTimeOffset now = timeProvider.GetUtcNow();
        string hourKey = now.ToString("yyyyMMddHH", System.Globalization.CultureInfo.InvariantCulture);
        string dayKey = now.ToString("yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);

        lock (_globalLock)
        {
            if (!context.UseDistributedIdentityAbuseLimit)
            {
                if (IsDuplicatePayload(context.PayloadFingerprint, now))
                    return QuickScanGuardDecision.Reject(QuickScanGuardRejectionReason.DuplicatePayload);

                if (GetCount(_globalHourlyRequests, hourKey) >= options.GlobalMaxRequestsPerHour)
                    return QuickScanGuardDecision.Reject(QuickScanGuardRejectionReason.GlobalHourlyRequestLimit);

                if (GetCount(_globalDailyRequests, dayKey) >= options.GlobalMaxRequestsPerDay)
                    return QuickScanGuardDecision.Reject(QuickScanGuardRejectionReason.GlobalDailyRequestLimit);

                string ipHourKey = $"{context.ClientIp}:{hourKey}";
                string ipDayKey = $"{context.ClientIp}:{dayKey}";
                string sessionDayKey = $"{context.SessionId}:{dayKey}";

                if (GetCount(_ipHourly, ipHourKey) >= options.MaxScansPerIpPerHour)
                    return QuickScanGuardDecision.Reject(QuickScanGuardRejectionReason.PerIpHourlyLimit);

                if (GetCount(_ipDaily, ipDayKey) >= options.MaxScansPerIpPerDay)
                    return QuickScanGuardDecision.Reject(QuickScanGuardRejectionReason.PerIpDailyLimit);

                if (GetCount(_sessionDaily, sessionDayKey) >= options.MaxScansPerSessionPerDay)
                    return QuickScanGuardDecision.Reject(QuickScanGuardRejectionReason.PerSessionDailyLimit);

                if (options.SignInRequiredAfterSessionScans > 0
                    && GetCount(_sessionDaily, sessionDayKey) >= options.SignInRequiredAfterSessionScans)
                {
                    return QuickScanGuardDecision.Reject(QuickScanGuardRejectionReason.SignInRequired);
                }
            }

            if (GetSpend(_globalHourlySpend, hourKey) >= options.GlobalMaxSpendUsdPerHour)
                return QuickScanGuardDecision.Reject(QuickScanGuardRejectionReason.GlobalHourlySpendCeiling);

            if (GetSpend(_globalDailySpend, dayKey) >= options.GlobalMaxSpendUsdPerDay)
                return QuickScanGuardDecision.Reject(QuickScanGuardRejectionReason.GlobalDailySpendCeiling);

            if (!context.UseDistributedConcurrencyLimit
                && Volatile.Read(ref _concurrentScans) >= options.MaxConcurrentScans)
                return QuickScanGuardDecision.Reject(QuickScanGuardRejectionReason.ConcurrentScanLimit);
        }

        return QuickScanGuardDecision.Permit();
    }

    public void RecordScanStarted(QuickScanGuardContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        QuickScanOptions options = optionsMonitor.CurrentValue;
        DateTimeOffset now = timeProvider.GetUtcNow();
        string hourKey = now.ToString("yyyyMMddHH", System.Globalization.CultureInfo.InvariantCulture);
        string dayKey = now.ToString("yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);

        if (!context.UseDistributedConcurrencyLimit)
        {
            Interlocked.Increment(ref _concurrentScans);
        }

        if (!context.UseDistributedIdentityAbuseLimit)
        {
            lock (_globalLock)
            {
                Increment(_globalHourlyRequests, hourKey);
                Increment(_globalDailyRequests, dayKey);

                string ipHourKey = $"{context.ClientIp}:{hourKey}";
                string ipDayKey = $"{context.ClientIp}:{dayKey}";
                string sessionDayKey = $"{context.SessionId}:{dayKey}";

                Increment(_ipHourly, ipHourKey);
                Increment(_ipDaily, ipDayKey);
                Increment(_sessionDaily, sessionDayKey);
                _recentPayloads[context.PayloadFingerprint] = now;
                PruneRecentPayloads(now);
            }
        }

        _ = options;
    }

    public void RecordScanCompleted(
        QuickScanGuardContext context,
        bool succeeded,
        decimal estimatedCostUsd,
        int inputTokens,
        int outputTokens,
        TimeSpan duration)
    {
        ArgumentNullException.ThrowIfNull(context);

        if (!context.UseDistributedConcurrencyLimit)
        {
            Interlocked.Decrement(ref _concurrentScans);
        }

        if (estimatedCostUsd <= 0m)
            return;

        DateTimeOffset now = timeProvider.GetUtcNow();
        string hourKey = now.ToString("yyyyMMddHH", System.Globalization.CultureInfo.InvariantCulture);
        string dayKey = now.ToString("yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);

        lock (_globalLock)
        {
            AddSpend(_globalHourlySpend, hourKey, estimatedCostUsd);
            AddSpend(_globalDailySpend, dayKey, estimatedCostUsd);
        }

        _ = succeeded;
        _ = inputTokens;
        _ = outputTokens;
        _ = duration;
    }

    public void RecordRejection(QuickScanGuardContext context, QuickScanGuardRejectionReason reason)
    {
        _ = context;
        _ = reason;
    }

    public QuickScanStatusResponse GetStatus(QuickScanGuardContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        QuickScanOptions options = optionsMonitor.CurrentValue;
        QuickScanGuardDecision decision = TryBeginScan(context);

        return new QuickScanStatusResponse
        {
            Enabled = options.Enabled,
            CapacityAvailable = decision.Allowed,
            RequireSignIn = decision.RejectionReason == QuickScanGuardRejectionReason.SignInRequired,
            SampleResultAvailable = true,
        };
    }

    private bool IsDuplicatePayload(string fingerprint, DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(fingerprint))
            return false;

        if (!_recentPayloads.TryGetValue(fingerprint, out DateTimeOffset seenAt))
            return false;

        return now - seenAt < TimeSpan.FromMinutes(2);
    }

    private void PruneRecentPayloads(DateTimeOffset now)
    {
        List<string> expired = _recentPayloads
            .Where(pair => now - pair.Value > TimeSpan.FromMinutes(5))
            .Select(pair => pair.Key)
            .ToList();

        foreach (string key in expired)
            _recentPayloads.Remove(key);
    }

    private static int GetCount(Dictionary<string, PeriodCounter> store, string key)
    {
        if (!store.ContainsKey(key))
            return 0;

        return store[key].Value;
    }

    private static decimal GetSpend(Dictionary<string, decimal> store, string key) =>
        store.TryGetValue(key, out decimal value) ? value : 0m;

    private static void Increment(Dictionary<string, PeriodCounter> store, string key)
    {
        if (!store.ContainsKey(key))
        {
            store[key] = new PeriodCounter(1);
            return;
        }

        store[key] = new PeriodCounter(store[key].Value + 1);
    }

    private static void AddSpend(Dictionary<string, decimal> store, string key, decimal amount)
    {
        store[key] = GetSpend(store, key) + amount;
    }

    private sealed record PeriodCounter(int Value);
}
