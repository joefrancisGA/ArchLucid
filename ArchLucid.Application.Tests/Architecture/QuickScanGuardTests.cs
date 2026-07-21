using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class QuickScanGuardTests
{
    [Fact]
    public void TryBeginScan_rejects_when_kill_switch_disabled()
    {
        QuickScanGuard guard = CreateGuard(new QuickScanOptions { Enabled = false });
        QuickScanGuardContext context = new() { ClientIp = "1.1.1.1", SessionId = "s1", PayloadFingerprint = "fp1" };

        QuickScanGuardDecision decision = guard.TryBeginScan(context);

        decision.Allowed.Should().BeFalse();
        decision.RejectionReason.Should().Be(QuickScanGuardRejectionReason.Disabled);
    }

    [Fact]
    public void TryBeginScan_enforces_global_daily_spend_ceiling()
    {
        QuickScanOptions options = new()
        {
            Enabled = true,
            GlobalMaxSpendUsdPerDay = 0.01m,
        };

        QuickScanGuard guard = CreateGuard(options);
        QuickScanGuardContext firstScan = new() { ClientIp = "1.1.1.1", SessionId = "s1", PayloadFingerprint = "fp1" };

        guard.RecordScanStarted(firstScan);
        guard.RecordScanCompleted(firstScan, succeeded: true, 0.02m, 100, 50, TimeSpan.FromSeconds(1));

        // Distinct payload fingerprint isolates the global spend ceiling from the
        // separate duplicate-payload abuse guard (checked first in TryBeginScan).
        QuickScanGuardContext nextScan = new() { ClientIp = "1.1.1.1", SessionId = "s1", PayloadFingerprint = "fp2" };
        QuickScanGuardDecision decision = guard.TryBeginScan(nextScan);

        decision.Allowed.Should().BeFalse();
        decision.RejectionReason.Should().Be(QuickScanGuardRejectionReason.GlobalDailySpendCeiling);
    }

    private static QuickScanGuard CreateGuard(QuickScanOptions options) =>
        new(new TestOptionsMonitor(options), TimeProvider.System);

    private sealed class TestOptionsMonitor(QuickScanOptions value) : IOptionsMonitor<QuickScanOptions>
    {
        public QuickScanOptions CurrentValue => value;

        public QuickScanOptions Get(string? name) => value;

        public IDisposable? OnChange(Action<QuickScanOptions, string?> listener) => null;
    }
}
