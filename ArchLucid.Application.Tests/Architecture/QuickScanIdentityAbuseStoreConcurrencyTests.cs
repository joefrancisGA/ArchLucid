using ArchLucid.Application.Architecture;
using ArchLucid.Core.QuickScan;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class QuickScanIdentityAbuseStoreConcurrencyTests
{
    private static readonly DateTimeOffset BaseUtc = new(2026, 8, 3, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task TryAdmitAsync_concurrent_workers_never_exceed_session_hourly_limit()
    {
        InMemoryQuickScanIdentityAbuseStore store = new();
        const int workerCount = 20;
        const int maxSessionHour = 3;
        int admittedCount = 0;

        await Parallel.ForAsync(
            0,
            workerCount,
            new ParallelOptions { MaxDegreeOfParallelism = 12 },
            async (index, _) =>
            {
                QuickScanIdentityAbuseStoreAdmitResult result = await store.TryAdmitAsync(
                    BuildRequest(
                        sessionHourKey: "sh:shared:2026080312",
                        sessionDayKey: $"sd:shared:20260803-{index}",
                        contentHash: Convert.ToHexString(Guid.NewGuid().ToByteArray()).ToLowerInvariant().PadRight(64, '0')[..64],
                        maxSessionHour: maxSessionHour));

                if (result.Outcome == QuickScanIdentityAbuseStoreAdmitOutcome.Admitted)
                    Interlocked.Increment(ref admittedCount);
            });

        admittedCount.Should().Be(maxSessionHour);
    }

    [Fact]
    public async Task TryAdmitAsync_rejects_duplicate_content_hash_within_window()
    {
        InMemoryQuickScanIdentityAbuseStore store = new();
        const string contentHash = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

        QuickScanIdentityAbuseStoreAdmitResult first = await store.TryAdmitAsync(
            BuildRequest(contentHash: contentHash, sessionHourKey: "sh:a:1", sessionDayKey: "sd:a:1"));
        QuickScanIdentityAbuseStoreAdmitResult second = await store.TryAdmitAsync(
            BuildRequest(contentHash: contentHash, sessionHourKey: "sh:b:1", sessionDayKey: "sd:b:1"));

        first.Outcome.Should().Be(QuickScanIdentityAbuseStoreAdmitOutcome.Admitted);
        second.Outcome.Should().Be(QuickScanIdentityAbuseStoreAdmitOutcome.Duplicate);
    }

    [Fact]
    public async Task TryAdmitAsync_requires_sign_in_after_session_threshold_without_incrementing_further()
    {
        InMemoryQuickScanIdentityAbuseStore store = new();

        QuickScanIdentityAbuseStoreAdmitResult first = await store.TryAdmitAsync(
            BuildRequest(
                sessionHourKey: "sh:signin:h",
                sessionDayKey: "sd:signin:d",
                contentHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                signInAfter: 1));
        QuickScanIdentityAbuseStoreAdmitResult blocked = await store.TryAdmitAsync(
            BuildRequest(
                sessionHourKey: "sh:signin:h",
                sessionDayKey: "sd:signin:d",
                contentHash: "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
                signInAfter: 1));

        first.Outcome.Should().Be(QuickScanIdentityAbuseStoreAdmitOutcome.Admitted);
        blocked.Outcome.Should().Be(QuickScanIdentityAbuseStoreAdmitOutcome.SignInRequired);
    }

    private static QuickScanIdentityAbuseStoreAdmitRequest BuildRequest(
        string? sessionHourKey = null,
        string? sessionDayKey = null,
        string? contentHash = null,
        int maxSessionHour = 100,
        int signInAfter = 0)
    {
        string hash = contentHash
            ?? Convert.ToHexString(Guid.NewGuid().ToByteArray()).ToLowerInvariant().PadRight(64, '0')[..64];

        return new QuickScanIdentityAbuseStoreAdmitRequest
        {
            SessionHourKey = sessionHourKey ?? $"sh:{Guid.NewGuid():N}:h",
            SessionDayKey = sessionDayKey ?? $"sd:{Guid.NewGuid():N}:d",
            BrowserHourKey = $"bh:{Guid.NewGuid():N}:h",
            BrowserDayKey = $"bd:{Guid.NewGuid():N}:d",
            IpHourKey = $"ih:{Guid.NewGuid():N}:h",
            IpDayKey = $"id:{Guid.NewGuid():N}:d",
            IpRangeHourKey = $"rh:{Guid.NewGuid():N}:h",
            IpRangeDayKey = $"rd:{Guid.NewGuid():N}:d",
            GlobalHourKey = "gh:global:h",
            GlobalDayKey = "gd:global:d",
            BurstMinuteKey = $"bm:{Guid.NewGuid():N}:m",
            BurstFiveMinuteKey = $"b5:{Guid.NewGuid():N}:5",
            ContentHash = hash,
            UtcNow = BaseUtc,
            DuplicateWindowSeconds = 300,
            MaxSessionHour = maxSessionHour,
            MaxSessionDay = 100,
            MaxBrowserHour = 100,
            MaxBrowserDay = 100,
            MaxIpHour = 100,
            MaxIpDay = 100,
            MaxIpRangeHour = 100,
            MaxIpRangeDay = 100,
            MaxGlobalHour = 10_000,
            MaxGlobalDay = 10_000,
            MaxBurstMinute = 10_000,
            MaxBurstFiveMinutes = 10_000,
            SignInAfterSessionScans = signInAfter,
            CaptchaAfterSessionScans = 0,
            CaptchaSatisfied = false,
        };
    }
}
