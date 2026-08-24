using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Notifications;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class WaiverExpiryNotificationServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    private static readonly DateTimeOffset NowUtc = new(2026, 8, 12, 6, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task RunTenantPassAsync_sends_a_reminder_and_audits_it()
    {
        Harness harness = new();
        harness.WithActiveWaivers(Waiver(daysUntilExpiry: 6));

        int sent = await harness.Service.RunTenantPassAsync(TenantId);

        sent.Should().Be(1);
        harness.SentMessages.Should().HaveCount(1);
        harness.SentMessages[0].To.Should().Be("owner@example.com");
        harness.AuditedEvents.Should().ContainSingle(
            auditEvent => auditEvent.EventType == AuditEventTypes.RiskExceptionExpiryReminderSent);
    }

    [Fact]
    public async Task RunTenantPassAsync_still_lists_active_waivers_so_expiry_becomes_authoritative()
    {
        Harness harness = new();
        harness.WithActiveWaivers();

        await harness.Service.RunTenantPassAsync(TenantId);

        harness.RiskExceptions.Verify(
            service => service.ListActiveAsync(TenantId, null, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RunTenantPassAsync_sends_nothing_when_no_waiver_has_entered_a_boundary()
    {
        Harness harness = new();
        harness.WithActiveWaivers(Waiver(daysUntilExpiry: 120));

        int sent = await harness.Service.RunTenantPassAsync(TenantId);

        sent.Should().Be(0);
        harness.SentMessages.Should().BeEmpty();
    }

    [Fact]
    public async Task RunTenantPassAsync_is_idempotent_across_repeat_passes_on_the_same_boundary()
    {
        Harness harness = new();
        harness.WithActiveWaivers(Waiver(daysUntilExpiry: 6));

        int first = await harness.Service.RunTenantPassAsync(TenantId);
        int second = await harness.Service.RunTenantPassAsync(TenantId);

        first.Should().Be(1);
        second.Should().Be(0);
        harness.SentMessages.Should().HaveCount(1);
    }

    [Fact]
    public async Task RunTenantPassAsync_honors_an_explicit_customer_email_opt_out()
    {
        Harness harness = new();
        harness.WithActiveWaivers(Waiver(daysUntilExpiry: 6));
        harness.WithEmailChannelPreference(configured: true, emailEnabled: false);

        int sent = await harness.Service.RunTenantPassAsync(TenantId);

        sent.Should().Be(0);
        harness.SentMessages.Should().BeEmpty();
    }

    [Fact]
    public async Task RunTenantPassAsync_keeps_reminders_on_when_the_tenant_has_no_preference_row()
    {
        Harness harness = new();
        harness.WithActiveWaivers(Waiver(daysUntilExpiry: 6));
        harness.WithEmailChannelPreference(configured: false, emailEnabled: false);

        int sent = await harness.Service.RunTenantPassAsync(TenantId);

        sent.Should().Be(1);
    }

    [Fact]
    public async Task RunTenantPassAsync_returns_zero_when_the_feature_is_disabled()
    {
        Harness harness = new(new WaiverExpiryNotificationOptions { Enabled = false });
        harness.WithActiveWaivers(Waiver(daysUntilExpiry: 6));

        int sent = await harness.Service.RunTenantPassAsync(TenantId);

        sent.Should().Be(0);
        harness.RiskExceptions.Verify(
            service => service.ListActiveAsync(It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RunTenantPassAsync_skips_a_waiver_with_no_addressable_recipient()
    {
        Harness harness = new();
        harness.WithActiveWaivers(Waiver(daysUntilExpiry: 6, ownerUserId: "dir-1", createdByUserId: "dir-2"));
        harness.WithTenantAdminEmail(null);

        int sent = await harness.Service.RunTenantPassAsync(TenantId);

        sent.Should().Be(0);
        harness.SentMessages.Should().BeEmpty();
    }

    [Fact]
    public async Task RunTenantPassAsync_records_the_ledger_entry_before_sending()
    {
        Harness harness = new();
        harness.WithActiveWaivers(Waiver(daysUntilExpiry: 6));

        await harness.Service.RunTenantPassAsync(TenantId);

        harness.LedgerEntries.Should().HaveCount(1);
        harness.LedgerEntries[0].TemplateId.Should().Be(WaiverExpiryReminderIdempotency.EmailTemplateId);
        harness.LedgerEntries[0].TenantId.Should().Be(TenantId);
    }

    [Fact]
    public async Task RunTenantPassAsync_throws_when_send_fails_after_ledger_reservation()
    {
        Harness harness = new();
        harness.WithActiveWaivers(Waiver(daysUntilExpiry: 6));
        harness.WithSendFailure(new InvalidOperationException("provider down"));

        Func<Task> act = () => harness.Service.RunTenantPassAsync(TenantId);

        await act.Should().ThrowAsync<InvalidOperationException>();
        harness.LedgerEntries.Should().HaveCount(1);
        harness.SentMessages.Should().BeEmpty();
    }

    [Fact]
    public async Task RunTenantPassAsync_rejects_an_empty_tenant_id()
    {
        Harness harness = new();

        Func<Task> act = () => harness.Service.RunTenantPassAsync(Guid.Empty);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    private static RiskExceptionRecord Waiver(
        int daysUntilExpiry,
        string ownerUserId = "owner@example.com",
        string createdByUserId = "owner@example.com")
    {
        return new RiskExceptionRecord
        {
            RiskExceptionId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            TenantId = TenantId,
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            FindingId = "f-1",
            OwnerUserId = ownerUserId,
            CreatedByUserId = createdByUserId,
            Rationale = "Accepted for the pilot window.",
            ExpiresAtUtc = NowUtc.AddDays(daysUntilExpiry),
            Status = RiskExceptionStatus.Active,
            CreatedAtUtc = NowUtc.AddDays(-30),
        };
    }

    private sealed class FakeTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    /// <summary>Wires the service against in-memory doubles so each test only states the behavior it cares about.</summary>
    private sealed class Harness
    {
        public Harness(WaiverExpiryNotificationOptions? options = null)
        {
            RiskExceptions = new Mock<IRiskExceptionService>(MockBehavior.Loose);
            WithActiveWaivers();

            Mock<ITenantNotificationChannelPreferencesRepository> preferences = new();
            Preferences = preferences;
            WithEmailChannelPreference(configured: true, emailEnabled: true);

            Mock<ITenantTrialEmailContactLookup> adminLookup = new();
            AdminLookup = adminLookup;
            WithTenantAdminEmail("admin@example.com");

            Mock<ISentEmailLedger> ledger = new();
            ledger
                .Setup(instance => instance.TryRecordSentAsync(
                    It.IsAny<SentEmailLedgerEntry>(),
                    It.IsAny<CancellationToken>()))
                .Returns((SentEmailLedgerEntry entry, CancellationToken _) =>
                    Task.FromResult(RecordLedgerEntry(entry)));

            EmailProvider = new Mock<IEmailProvider>();
            EmailProvider.SetupGet(instance => instance.ProviderName).Returns("test-provider");
            WithSendSuccess();

            Mock<IAuditService> audit = new();
            audit
                .Setup(instance => instance.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
                .Returns((AuditEvent auditEvent, CancellationToken _) =>
                {
                    AuditedEvents.Add(auditEvent);

                    return Task.CompletedTask;
                });

            Service = new WaiverExpiryNotificationService(
                RiskExceptions.Object,
                preferences.Object,
                adminLookup.Object,
                ledger.Object,
                EmailProvider.Object,
                MonitorFor(new EmailNotificationOptions
                {
                    OperatorBaseUrl = "https://app.example.com",
                    ProductDisplayName = "ArchLucid",
                }),
                MonitorFor(options ?? new WaiverExpiryNotificationOptions()),
                audit.Object,
                new FakeTimeProvider(NowUtc),
                NullLogger<WaiverExpiryNotificationService>.Instance);
        }

        public List<AuditEvent> AuditedEvents { get; } = [];

        public List<SentEmailLedgerEntry> LedgerEntries { get; } = [];

        public Mock<IRiskExceptionService> RiskExceptions { get; }

        public List<EmailMessage> SentMessages { get; } = [];

        public WaiverExpiryNotificationService Service { get; }

        private Mock<IEmailProvider> EmailProvider { get; }

        private Mock<ITenantTrialEmailContactLookup> AdminLookup { get; }

        private Mock<ITenantNotificationChannelPreferencesRepository> Preferences { get; }

        private HashSet<string> UsedIdempotencyKeys { get; } = new(StringComparer.Ordinal);

        public void WithActiveWaivers(params RiskExceptionRecord[] waivers)
        {
            RiskExceptions
                .Setup(service => service.ListActiveAsync(TenantId, null, It.IsAny<CancellationToken>()))
                .ReturnsAsync(waivers);
        }

        public void WithEmailChannelPreference(bool configured, bool emailEnabled)
        {
            Preferences
                .Setup(repository => repository.GetByTenantAsync(TenantId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new TenantNotificationChannelPreferencesResponse
                {
                    TenantId = TenantId,
                    IsConfigured = configured,
                    EmailCustomerNotificationsEnabled = emailEnabled,
                });
        }

        public void WithTenantAdminEmail(string? email)
        {
            AdminLookup
                .Setup(lookup => lookup.TryResolveAdminEmailAsync(TenantId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(email);
        }

        public void WithSendFailure(Exception exception)
        {
            EmailProvider
                .Setup(instance => instance.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(exception);
        }

        public void WithSendSuccess()
        {
            EmailProvider
                .Setup(instance => instance.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
                .Returns((EmailMessage message, CancellationToken _) =>
                {
                    SentMessages.Add(message);

                    return Task.CompletedTask;
                });
        }

        private static IOptionsMonitor<TOptions> MonitorFor<TOptions>(TOptions options)
            where TOptions : class
        {
            Mock<IOptionsMonitor<TOptions>> monitor = new();
            monitor.SetupGet(instance => instance.CurrentValue).Returns(options);

            return monitor.Object;
        }

        /// <summary>Mimics the SQL ledger's unique-key insert: the first caller wins, later duplicates are refused.</summary>
        private bool RecordLedgerEntry(SentEmailLedgerEntry entry)
        {
            if (!UsedIdempotencyKeys.Add(entry.IdempotencyKey))
                return false;

            LedgerEntries.Add(entry);

            return true;
        }
    }
}
