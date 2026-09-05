using ArchLucid.Application.Notifications.Email;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Notifications;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Category", "Unit")]
public sealed class TrialLifecycleEmailDispatcherTests
{
    [Fact]
    public async Task DispatchAsync_render_failure_does_not_block_retry()
    {
        Guid tenantId = Guid.Parse("31313131-3131-3131-3131-313131313131");
        InMemorySentEmailLedger ledger = new();
        int renderAttempts = 0;

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord
            {
                Id = tenantId,
                Name = "Acme",
                TrialStatus = TrialLifecycleStatus.Active,
            });

        Mock<ITenantTrialEmailContactLookup> contactLookup = new();
        contactLookup.Setup(l => l.TryResolveAdminEmailAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("admin@example.test");

        Mock<IEmailProvider> provider = new();
        provider.SetupGet(p => p.ProviderName).Returns("test-provider");
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                renderAttempts++;

                if (renderAttempts == 1)
                    return Task.FromException<string>(new InvalidOperationException("render failed"));

                return Task.FromResult("<p>ok</p>");
            });
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("ok");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        TrialLifecycleEmailDispatcher sut = new(
            tenantRepository.Object,
            contactLookup.Object,
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<TrialLifecycleEmailDispatcher>.Instance);

        TrialLifecycleEmailIntegrationEnvelope envelope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("32323232-3232-3232-3232-323232323232"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Trigger = TrialLifecycleEmailTrigger.TrialProvisioned,
        };

        Func<Task> firstAttempt = () => sut.DispatchAsync(envelope, CancellationToken.None);

        await firstAttempt.Should().ThrowAsync<InvalidOperationException>();

        await sut.DispatchAsync(envelope, CancellationToken.None);

        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Once,
            "template render failures must not reserve the trial lifecycle ledger");
    }

    [Fact]
    public async Task DispatchAsync_send_failure_does_not_block_retry()
    {
        Guid tenantId = Guid.Parse("34343434-3434-3434-3434-343434343434");
        InMemorySentEmailLedger ledger = new();
        int sendAttempts = 0;

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord
            {
                Id = tenantId,
                Name = "Acme",
                TrialStatus = TrialLifecycleStatus.Active,
            });

        Mock<ITenantTrialEmailContactLookup> contactLookup = new();
        contactLookup.Setup(l => l.TryResolveAdminEmailAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("admin@example.test");

        Mock<IEmailProvider> provider = new();
        provider.SetupGet(p => p.ProviderName).Returns("test-provider");
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                sendAttempts++;

                if (sendAttempts == 1)
                    return Task.FromException(new InvalidOperationException("smtp down"));

                return Task.CompletedTask;
            });

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("<p>ok</p>");
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("ok");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        TrialLifecycleEmailDispatcher sut = new(
            tenantRepository.Object,
            contactLookup.Object,
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<TrialLifecycleEmailDispatcher>.Instance);

        TrialLifecycleEmailIntegrationEnvelope envelope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("35353535-3535-3535-3535-353535353535"),
            ProjectId = Guid.Parse("36363636-3636-3636-3636-363636363636"),
            Trigger = TrialLifecycleEmailTrigger.TrialProvisioned,
        };

        Func<Task> firstAttempt = () => sut.DispatchAsync(envelope, CancellationToken.None);

        await firstAttempt.Should().ThrowAsync<InvalidOperationException>();

        await sut.DispatchAsync(envelope, CancellationToken.None);

        sendAttempts.Should().Be(2, "transient send failures must not permanently suppress trial lifecycle mail");
        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task DispatchAsync_sends_welcome_when_lowercase_active_trial_status()
    {
        Guid tenantId = Guid.Parse("37373737-3737-3737-3737-373737373737");
        InMemorySentEmailLedger ledger = new();

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord
            {
                Id = tenantId,
                Name = "Acme",
                TrialStatus = "active",
            });

        Mock<ITenantTrialEmailContactLookup> contactLookup = new();
        contactLookup.Setup(l => l.TryResolveAdminEmailAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("admin@example.test");

        Mock<IEmailProvider> provider = new();
        provider.SetupGet(p => p.ProviderName).Returns("test-provider");
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("<p>ok</p>");
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("ok");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        TrialLifecycleEmailDispatcher sut = new(
            tenantRepository.Object,
            contactLookup.Object,
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<TrialLifecycleEmailDispatcher>.Instance);

        TrialLifecycleEmailIntegrationEnvelope envelope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("38383838-3838-3838-3838-383838383838"),
            ProjectId = Guid.Parse("39393939-3939-3939-3939-393939393939"),
            Trigger = TrialLifecycleEmailTrigger.TrialProvisioned,
        };

        await sut.DispatchAsync(envelope, CancellationToken.None);

        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Once,
            "lowercase active trial status must pass the trigger gate like canonical Active");
    }

    [Fact]
    public async Task DispatchAsync_sends_mid_trial_email_when_trial_status_is_lowercase_active()
    {
        Guid tenantId = Guid.Parse("3a3a3a3a-3a3a-3a3a-3a3a-3a3a3a3a3a3a");
        DateTimeOffset utcNow = DateTimeOffset.UtcNow;

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord
            {
                Id = tenantId,
                Name = "Acme",
                TrialStatus = "active",
                TrialStartUtc = utcNow.AddDays(-8),
                TrialExpiresUtc = utcNow.AddDays(7),
            });

        Mock<ITenantTrialEmailContactLookup> contactLookup = new();
        contactLookup.Setup(l => l.TryResolveAdminEmailAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("admin@example.test");

        Mock<IEmailProvider> provider = new();
        provider.SetupGet(p => p.ProviderName).Returns("test-provider");
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("<p>ok</p>");
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("ok");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        TrialLifecycleEmailDispatcher sut = new(
            tenantRepository.Object,
            contactLookup.Object,
            renderer.Object,
            provider.Object,
            new InMemorySentEmailLedger(),
            options.Object,
            NullLogger<TrialLifecycleEmailDispatcher>.Instance);

        TrialLifecycleEmailIntegrationEnvelope envelope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b3b"),
            ProjectId = Guid.Parse("3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c"),
            Trigger = TrialLifecycleEmailTrigger.MidTrialDay7,
        };

        await sut.DispatchAsync(envelope, CancellationToken.None);

        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Once,
            "lowercase active trial status must not suppress lifecycle email triggers");
    }

    [Fact]
    public async Task DispatchAsync_sends_welcome_when_padded_active_trial_status()
    {
        Guid tenantId = Guid.Parse("3d3d3d3d-3d3d-3d3d-3d3d-3d3d3d3d3d3d");
        InMemorySentEmailLedger ledger = new();

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord
            {
                Id = tenantId,
                Name = "Acme",
                TrialStatus = " active ",
            });

        Mock<ITenantTrialEmailContactLookup> contactLookup = new();
        contactLookup.Setup(l => l.TryResolveAdminEmailAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("admin@example.test");

        Mock<IEmailProvider> provider = new();
        provider.SetupGet(p => p.ProviderName).Returns("test-provider");
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("<p>ok</p>");
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("ok");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        TrialLifecycleEmailDispatcher sut = new(
            tenantRepository.Object,
            contactLookup.Object,
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<TrialLifecycleEmailDispatcher>.Instance);

        TrialLifecycleEmailIntegrationEnvelope envelope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("3e3e3e3e-3e3e-3e3e-3e3e-3e3e3e3e3e3e"),
            ProjectId = Guid.Parse("3f3f3f3f-3f3f-3f3f-3f3f-3f3f3f3f3f3f"),
            Trigger = TrialLifecycleEmailTrigger.TrialProvisioned,
        };

        await sut.DispatchAsync(envelope, CancellationToken.None);

        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Once,
            "padded active trial status must pass the trigger gate like canonical Active");
    }

    [Fact]
    public async Task DispatchAsync_sends_expired_email_when_trial_status_already_expired()
    {
        Guid tenantId = Guid.Parse("50505050-5050-5050-5050-505050505050");
        DateTimeOffset utcNow = DateTimeOffset.UtcNow;

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord
            {
                Id = tenantId,
                Name = "Acme",
                TrialStatus = TrialLifecycleStatus.Expired,
                TrialExpiresUtc = utcNow.AddDays(-1),
            });

        Mock<ITenantTrialEmailContactLookup> contactLookup = new();
        contactLookup.Setup(l => l.TryResolveAdminEmailAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("admin@example.test");

        Mock<IEmailProvider> provider = new();
        provider.SetupGet(p => p.ProviderName).Returns("test-provider");
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("<p>ok</p>");
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("ok");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        TrialLifecycleEmailDispatcher sut = new(
            tenantRepository.Object,
            contactLookup.Object,
            renderer.Object,
            provider.Object,
            new InMemorySentEmailLedger(),
            options.Object,
            NullLogger<TrialLifecycleEmailDispatcher>.Instance);

        TrialLifecycleEmailIntegrationEnvelope envelope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("51515151-5151-5151-5151-515151515151"),
            ProjectId = Guid.Parse("52525252-5252-5252-5252-525252525252"),
            Trigger = TrialLifecycleEmailTrigger.Expired,
        };

        await sut.DispatchAsync(envelope, CancellationToken.None);

        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Once,
            "expired lifecycle mail must still send when lifecycle scheduler advanced status before dispatch");
    }

    [Fact]
    public async Task DispatchAsync_skips_send_when_admin_mailbox_is_malformed()
    {
        Guid tenantId = Guid.Parse("51515151-5151-5151-5151-515151515151");

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord
            {
                Id = tenantId,
                Name = "Acme",
                TrialStatus = TrialLifecycleStatus.Active,
            });

        Mock<ITenantTrialEmailContactLookup> contactLookup = new();
        contactLookup.Setup(l => l.TryResolveAdminEmailAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("finance@");

        Mock<IEmailProvider> provider = new();
        provider.SetupGet(p => p.ProviderName).Returns("test-provider");

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("<p>ok</p>");
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("ok");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        TrialLifecycleEmailDispatcher sut = new(
            tenantRepository.Object,
            contactLookup.Object,
            renderer.Object,
            provider.Object,
            new InMemorySentEmailLedger(),
            options.Object,
            NullLogger<TrialLifecycleEmailDispatcher>.Instance);

        TrialLifecycleEmailIntegrationEnvelope envelope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("52525252-5252-5252-5252-525252525252"),
            ProjectId = Guid.Parse("53535353-5353-5353-5353-535353535353"),
            Trigger = TrialLifecycleEmailTrigger.TrialProvisioned,
        };

        await sut.DispatchAsync(envelope, CancellationToken.None);

        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
