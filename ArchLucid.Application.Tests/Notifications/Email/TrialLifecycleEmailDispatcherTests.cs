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
}
