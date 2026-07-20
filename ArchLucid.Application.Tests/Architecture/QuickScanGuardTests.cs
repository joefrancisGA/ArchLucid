using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class QuickScanRequestValidatorTests
{
    private static readonly QuickScanOptions DefaultOptions = new();

    [Fact]
    public void TryValidate_rejects_unsupported_primary_environment()
    {
        ArchitectureQuickScanRequest request = new()
        {
            SystemName = "API",
            PrimaryEnvironment = "RandomCloud",
            Description = "desc",
        };

        bool ok = QuickScanRequestValidator.TryValidate(request, DefaultOptions, out _, out string? error);

        ok.Should().BeFalse();
        error.Should().Contain("primaryEnvironment");
    }

    [Fact]
    public void TryValidate_accepts_legacy_cloud_provider_alias()
    {
        ArchitectureQuickScanRequest request = new()
        {
            SystemName = "API",
            CloudProvider = "Azure",
            Description = "desc",
        };

        bool ok = QuickScanRequestValidator.TryValidate(request, DefaultOptions, out QuickScanRequestValidator.ValidatedQuickScanRequest? validated, out _);

        ok.Should().BeTrue();
        validated!.PrimaryEnvironment.Should().Be("Azure");
    }

    [Fact]
    public void TryValidate_limits_architecture_concerns()
    {
        ArchitectureQuickScanRequest request = new()
        {
            SystemName = "API",
            PrimaryEnvironment = "Azure",
            Description = "desc",
            ArchitectureConcerns = ["Security", "Reliability", "Cost", "Performance"],
        };

        bool ok = QuickScanRequestValidator.TryValidate(request, DefaultOptions, out _, out string? error);

        ok.Should().BeFalse();
        error.Should().Contain("at most");
    }
}

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
        QuickScanGuardContext context = new() { ClientIp = "1.1.1.1", SessionId = "s1", PayloadFingerprint = "fp1" };

        guard.RecordScanStarted(context);
        guard.RecordScanCompleted(context, succeeded: true, 0.02m, 100, 50, TimeSpan.FromSeconds(1));

        QuickScanGuardDecision decision = guard.TryBeginScan(context);

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
