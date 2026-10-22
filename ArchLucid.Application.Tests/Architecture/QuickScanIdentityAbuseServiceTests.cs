using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class QuickScanIdentityAbuseServiceTests
{
    [Fact]
    public async Task TryAdmitAsync_keys_never_contain_raw_description()
    {
        string description = "Unique payment processor with PCI scope and fraud rules";
        CapturingIdentityAbuseStore store = new();
        QuickScanIdentityAbuseService sut = CreateService(store, CreateSafety());

        QuickScanIdentityAbuseDecision decision = await sut.TryAdmitAsync(
            new QuickScanIdentityAbuseAdmitContext
            {
                ClientIp = "203.0.113.50",
                SessionId = "session-raw-check",
                BrowserId = "browser-raw-check",
                Description = description,
            });

        decision.Allowed.Should().BeTrue();
        store.LastRequest.Should().NotBeNull();
        store.LastRequest!.ContentHash.Should().NotContain(description, because: "content hash must not embed raw prompt text");
        store.LastRequest.SessionHourKey.Should().NotContain(description);
        store.LastRequest.IpHourKey.Should().NotContain("203.0.113.50");
        store.LastRequest.ContentHash.Should().Be(QuickScanContentFingerprint.Compute(description));
        store.LastRequest.DryRun.Should().BeFalse();
    }

    [Fact]
    public async Task EvaluateAsync_is_dry_run_and_does_not_require_bot_token_when_captcha_disabled()
    {
        CapturingIdentityAbuseStore store = new();
        QuickScanIdentityAbuseService sut = CreateService(store, CreateSafety());

        QuickScanIdentityAbuseDecision decision = await sut.EvaluateAsync(
            new QuickScanIdentityAbuseAdmitContext
            {
                ClientIp = "203.0.113.52",
                SessionId = "session-eval",
                BrowserId = "browser-eval",
                Description = "status probe",
            });

        decision.Allowed.Should().BeTrue();
        store.LastRequest.Should().NotBeNull();
        store.LastRequest!.DryRun.Should().BeTrue();
    }

    [Fact]
    public async Task TryAdmitAsync_maps_duplicate_outcome_to_guard_reason()
    {
        Mock<IQuickScanIdentityAbuseStore> store = new();
        store
            .Setup(s => s.TryAdmitAsync(It.IsAny<QuickScanIdentityAbuseStoreAdmitRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanIdentityAbuseStoreAdmitResult.Duplicate());

        QuickScanIdentityAbuseService sut = CreateService(store.Object, CreateSafety());

        QuickScanIdentityAbuseDecision decision = await sut.TryAdmitAsync(
            new QuickScanIdentityAbuseAdmitContext
            {
                ClientIp = "203.0.113.51",
                SessionId = "session-dup",
                BrowserId = "browser-dup",
                Description = "same architecture description",
            });

        decision.Allowed.Should().BeFalse();
        decision.RejectionReason.Should().Be(QuickScanGuardRejectionReason.DuplicatePayload);
    }

    [Fact]
    public void ContentFingerprint_is_stable_across_whitespace_and_case()
    {
        string left = QuickScanContentFingerprint.Compute("  Hello   World ");
        string right = QuickScanContentFingerprint.Compute("hello world");

        left.Should().Be(right);
    }

    [Fact]
    public void IdentityKeyMaterial_normalizes_ipv4_to_slash24()
    {
        QuickScanIdentityKeyMaterial.NormalizeIpRange("203.0.113.44").Should().Be("203.0.113.0/24");
    }

    private static QuickScanSafetyOptions CreateSafety() =>
        new()
        {
            Enabled = true,
            Identity = new QuickScanSafetyIdentityLimits
            {
                MaxScansPerSessionPerHour = 10,
                MaxScansPerSessionPerDay = 10,
            },
            ProgressiveFriction = new QuickScanSafetyProgressiveFrictionLimits
            {
                CaptchaEnabled = false,
                SignInFrictionEnabled = false,
            },
        };

    private static QuickScanIdentityAbuseService CreateService(
        IQuickScanIdentityAbuseStore store,
        QuickScanSafetyOptions safety)
    {
        Mock<IQuickScanBotChallengeVerifier> bot = new();
        bot.Setup(b => b.VerifyAsync(It.IsAny<string?>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

        return new QuickScanIdentityAbuseService(
            store,
            new TestSafetyOptionsMonitor(safety),
            bot.Object,
            TimeProvider.System);
    }

    private sealed class CapturingIdentityAbuseStore : IQuickScanIdentityAbuseStore
    {
        public QuickScanIdentityAbuseStoreAdmitRequest? LastRequest { get; private set; }

        public Task<QuickScanIdentityAbuseStoreAdmitResult> TryAdmitAsync(
            QuickScanIdentityAbuseStoreAdmitRequest request,
            CancellationToken cancellationToken = default)
        {
            LastRequest = request;

            return Task.FromResult(QuickScanIdentityAbuseStoreAdmitResult.Admitted());
        }
    }

    private sealed class TestSafetyOptionsMonitor(QuickScanSafetyOptions value) : IOptionsMonitor<QuickScanSafetyOptions>
    {
        public QuickScanSafetyOptions CurrentValue => value;

        public QuickScanSafetyOptions Get(string? name) => value;

        public IDisposable? OnChange(Action<QuickScanSafetyOptions, string?> listener) => null;
    }
}
