using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Hosting;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Hosting;

/// <summary>Unit coverage for <see cref="SamlCertExpiryNotificationWork" />.</summary>
[Trait("Suite", "Core")]
public sealed class SamlCertExpiryNotificationWorkTests
{
    private static readonly DateTimeOffset FixedUtc =
        new(2026, 5, 1, 12, 0, 0, TimeSpan.Zero);

    private sealed class FakeTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    private static IOptionsMonitor<EmailNotificationOptions> OptionsMonitorFrom(EmailNotificationOptions options)
    {
        Mock<IOptionsMonitor<EmailNotificationOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(options);

        return monitor.Object;
    }

    [Fact]
    public async Task RunDailyPassAsync_when_saml_disabled_does_not_touch_tenants()
    {
        Mock<ISamlOperationalDiagnosticsService> saml = new();
        saml.Setup(static s => s.BuildAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
            new AdminSamlOperationalHealthResponse { Saml2Enabled = false });

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);

        await SamlCertExpiryNotificationWork.RunDailyPassAsync(
            saml.Object,
            tenants.Object,
            Mock.Of<ITenantTrialEmailContactLookup>(),
            Mock.Of<ISentEmailLedger>(),
            Mock.Of<IEmailProvider>(),
            OptionsMonitorFrom(new EmailNotificationOptions()),
            new FakeTimeProvider(FixedUtc),
            NullLogger.Instance,
            CancellationToken.None);

        tenants.Verify(static t => t.ListAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RunDailyPassAsync_when_cert_valid_beyond_window_does_not_send_email()
    {
        Mock<ISamlOperationalDiagnosticsService> saml = new();
        saml.Setup(static s => s.BuildAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
            new AdminSamlOperationalHealthResponse
            {
                Saml2Enabled = true,
                SpSigningCertificateNotAfterUtc = FixedUtc.AddDays(40),
            });

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);

        Mock<IEmailProvider> email = new(MockBehavior.Strict);

        await SamlCertExpiryNotificationWork.RunDailyPassAsync(
            saml.Object,
            tenants.Object,
            Mock.Of<ITenantTrialEmailContactLookup>(),
            Mock.Of<ISentEmailLedger>(),
            email.Object,
            OptionsMonitorFrom(new EmailNotificationOptions()),
            new FakeTimeProvider(FixedUtc),
            NullLogger.Instance,
            CancellationToken.None);

        tenants.Verify(static t => t.ListAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RunDailyPassAsync_when_within_warning_window_sends_email_once_per_reserved_tenant()
    {
        Guid tenantId = Guid.Parse("a1111111-1111-4111-8111-111111111111");

        Mock<ISamlOperationalDiagnosticsService> saml = new();
        saml.Setup(static s => s.BuildAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
            new AdminSamlOperationalHealthResponse
            {
                Saml2Enabled = true,
                SpSigningCertificateNotAfterUtc = FixedUtc.AddDays(10),
            });

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(static t => t.ListAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
            [
                new TenantRecord
                {
                    Id = tenantId,
                    Name = "Contoso",
                    Slug = "contoso",
                    Tier = TenantTier.Standard,
                    DataRegion = "eastus",
                    CreatedUtc = FixedUtc,
                },
            ]);

        Mock<ITenantTrialEmailContactLookup> lookup = new();
        lookup.Setup(l => l.TryResolveAdminEmailAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("admin@contoso.example");

        Mock<ISentEmailLedger> ledger = new();
        ledger.Setup(static l => l.TryRecordSentAsync(It.IsAny<SentEmailLedgerEntry>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IEmailProvider> email = new();
        email.Setup(static e => e.ProviderName).Returns("Noop");

        await SamlCertExpiryNotificationWork.RunDailyPassAsync(
            saml.Object,
            tenants.Object,
            lookup.Object,
            ledger.Object,
            email.Object,
            OptionsMonitorFrom(new EmailNotificationOptions { OperatorBaseUrl = "https://app.example.com" }),
            new FakeTimeProvider(FixedUtc),
            NullLogger.Instance,
            CancellationToken.None);

        email.Verify(
            static e => e.SendAsync(It.Is<EmailMessage>(m => m.To == "admin@contoso.example"), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RunDailyPassAsync_when_ledger_rejects_idempotency_does_not_send()
    {
        Guid tenantId = Guid.Parse("b2222222-2222-4222-8222-222222222222");

        Mock<ISamlOperationalDiagnosticsService> saml = new();
        saml.Setup(static s => s.BuildAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
            new AdminSamlOperationalHealthResponse
            {
                Saml2Enabled = true,
                SpSigningCertificateNotAfterUtc = FixedUtc.AddDays(5),
            });

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(static t => t.ListAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
            [
                new TenantRecord
                {
                    Id = tenantId,
                    Name = "Fabrikam",
                    Slug = "fabrikam",
                    Tier = TenantTier.Standard,
                    DataRegion = "eastus",
                    CreatedUtc = FixedUtc,
                },
            ]);

        Mock<ITenantTrialEmailContactLookup> lookup = new();
        lookup.Setup(l => l.TryResolveAdminEmailAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("ops@fabrikam.example");

        Mock<ISentEmailLedger> ledger = new();
        ledger.Setup(static l => l.TryRecordSentAsync(It.IsAny<SentEmailLedgerEntry>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IEmailProvider> email = new(MockBehavior.Strict);
        email.Setup(static e => e.ProviderName).Returns("Noop");

        await SamlCertExpiryNotificationWork.RunDailyPassAsync(
            saml.Object,
            tenants.Object,
            lookup.Object,
            ledger.Object,
            email.Object,
            OptionsMonitorFrom(new EmailNotificationOptions()),
            new FakeTimeProvider(FixedUtc),
            NullLogger.Instance,
            CancellationToken.None);
    }

    [Fact]
    public async Task RunDailyPassAsync_skips_suspended_tenants()
    {
        Guid activeId = Guid.Parse("c3333333-3333-4333-8333-333333333333");
        Guid suspendedId = Guid.Parse("d4444444-4444-4444-8444-444444444444");

        Mock<ISamlOperationalDiagnosticsService> saml = new();
        saml.Setup(static s => s.BuildAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
            new AdminSamlOperationalHealthResponse
            {
                Saml2Enabled = true,
                SpSigningCertificateNotAfterUtc = FixedUtc.AddDays(3),
            });

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(static t => t.ListAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
            [
                new TenantRecord
                {
                    Id = activeId,
                    Name = "Active Co",
                    Slug = "active-co",
                    Tier = TenantTier.Standard,
                    DataRegion = "eastus",
                    CreatedUtc = FixedUtc,
                },
                new TenantRecord
                {
                    Id = suspendedId,
                    Name = "Suspended Co",
                    Slug = "suspended-co",
                    Tier = TenantTier.Standard,
                    DataRegion = "eastus",
                    CreatedUtc = FixedUtc,
                    SuspendedUtc = FixedUtc,
                },
            ]);

        Mock<ITenantTrialEmailContactLookup> lookup = new();
        lookup.Setup(l => l.TryResolveAdminEmailAsync(activeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("a@active.example");
        lookup.Setup(l => l.TryResolveAdminEmailAsync(suspendedId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("s@suspended.example");

        Mock<ISentEmailLedger> ledger = new();
        ledger.Setup(static l => l.TryRecordSentAsync(It.IsAny<SentEmailLedgerEntry>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IEmailProvider> email = new();
        email.Setup(static e => e.ProviderName).Returns("Noop");

        await SamlCertExpiryNotificationWork.RunDailyPassAsync(
            saml.Object,
            tenants.Object,
            lookup.Object,
            ledger.Object,
            email.Object,
            OptionsMonitorFrom(new EmailNotificationOptions()),
            new FakeTimeProvider(FixedUtc),
            NullLogger.Instance,
            CancellationToken.None);

        lookup.Verify(l => l.TryResolveAdminEmailAsync(suspendedId, It.IsAny<CancellationToken>()), Times.Never);
        email.Verify(
            static e => e.SendAsync(It.Is<EmailMessage>(m => m.To == "a@active.example"), It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
