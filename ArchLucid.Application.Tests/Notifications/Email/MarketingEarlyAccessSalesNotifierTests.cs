using ArchLucid.Application.Notifications.Email;
using ArchLucid.Contracts.Marketing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class MarketingEarlyAccessSalesNotifierTests
{
    private static MarketingEarlyAccessRequestInsertResult SampleInsert =>
        new(Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new DateTime(2026, 5, 16, 12, 0, 0, DateTimeKind.Utc));

    [SkippableFact]
    public async Task NotifyAsync_when_email_provider_is_noop_does_not_send()
    {
        Mock<IEmailProvider> email = new();
        email.SetupGet(x => x.ProviderName).Returns(EmailProviderNames.Noop);

        IOptionsMonitor<EmailNotificationOptions> options = BuildOptionsMonitor(
            new EmailNotificationOptions { PricingQuoteSalesInbox = "sales@archlucid.net" });

        MarketingEarlyAccessSalesNotifier sut = new(
            email.Object,
            options,
            NullLogger<MarketingEarlyAccessSalesNotifier>.Instance);

        await sut.NotifyAsync(SampleInsert, "buyer@example.com", "Contoso", "Architect", CancellationToken.None);

        email.Verify(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task NotifyAsync_when_inbox_empty_does_not_send()
    {
        Mock<IEmailProvider> email = new();
        email.SetupGet(x => x.ProviderName).Returns(EmailProviderNames.Smtp);

        IOptionsMonitor<EmailNotificationOptions> options = BuildOptionsMonitor(
            new EmailNotificationOptions { PricingQuoteSalesInbox = "  " });

        MarketingEarlyAccessSalesNotifier sut = new(
            email.Object,
            options,
            NullLogger<MarketingEarlyAccessSalesNotifier>.Instance);

        await sut.NotifyAsync(SampleInsert, "buyer@example.com", null, null, CancellationToken.None);

        email.Verify(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task NotifyAsync_when_smtp_provider_sends_to_configured_inbox()
    {
        Mock<IEmailProvider> email = new();
        email.SetupGet(x => x.ProviderName).Returns(EmailProviderNames.Smtp);
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        IOptionsMonitor<EmailNotificationOptions> options = BuildOptionsMonitor(
            new EmailNotificationOptions { PricingQuoteSalesInbox = "sales@archlucid.net" });

        MarketingEarlyAccessSalesNotifier sut = new(
            email.Object,
            options,
            NullLogger<MarketingEarlyAccessSalesNotifier>.Instance);

        await sut.NotifyAsync(SampleInsert, "buyer@example.com", "Contoso", "Architect", CancellationToken.None);

        email.Verify(
            x => x.SendAsync(
                It.Is<EmailMessage>(m =>
                    m.To == "sales@archlucid.net" &&
                    m.Subject.Contains("early access", StringComparison.OrdinalIgnoreCase) &&
                    m.IdempotencyKey.Contains("marketing-early-access", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static IOptionsMonitor<EmailNotificationOptions> BuildOptionsMonitor(EmailNotificationOptions value)
    {
        Mock<IOptionsMonitor<EmailNotificationOptions>> mock = new();
        mock.Setup(x => x.CurrentValue).Returns(value);

        return mock.Object;
    }
}
