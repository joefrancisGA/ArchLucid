using ArchLucid.Application.Notifications.Email;
using ArchLucid.Contracts.Marketing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;

using FluentAssertions;

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
    public async Task NotifyAsync_skips_send_when_sales_inbox_has_embedded_line_breaks()
    {
        Mock<IEmailProvider> email = new();
        email.SetupGet(x => x.ProviderName).Returns(EmailProviderNames.Smtp);

        IOptionsMonitor<EmailNotificationOptions> options = BuildOptionsMonitor(
            new EmailNotificationOptions
            {
                PricingQuoteSalesInbox = "sales@archlucid.net\r\nBcc: injected@evil.test"
            });

        MarketingEarlyAccessSalesNotifier sut = new(
            email.Object,
            options,
            NullLogger<MarketingEarlyAccessSalesNotifier>.Instance);

        await sut.NotifyAsync(SampleInsert, "buyer@example.com", "Contoso", "Architect", CancellationToken.None);

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

    [SkippableFact]
    public async Task NotifyAsync_html_encodes_company_name_with_form_feed_in_html_body()
    {
        Mock<IEmailProvider> email = new();
        email.SetupGet(x => x.ProviderName).Returns(EmailProviderNames.Smtp);
        EmailMessage? captured = null;
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, _) => captured = m)
            .Returns(Task.CompletedTask);

        IOptionsMonitor<EmailNotificationOptions> options = BuildOptionsMonitor(
            new EmailNotificationOptions { PricingQuoteSalesInbox = "sales@archlucid.net" });

        MarketingEarlyAccessSalesNotifier sut = new(
            email.Object,
            options,
            NullLogger<MarketingEarlyAccessSalesNotifier>.Instance);

        await sut.NotifyAsync(SampleInsert, "buyer@example.com", "Contoso\fLtd", "Architect", CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.HtmlBody.Should().Contain("Contoso Ltd");
        captured.HtmlBody.Should().NotContain("\f");
        captured.TextBody.Should().NotContain("\f");
    }

    [SkippableFact]
    public async Task NotifyAsync_strips_form_feed_from_role_in_html_body()
    {
        Mock<IEmailProvider> email = new();
        email.SetupGet(x => x.ProviderName).Returns(EmailProviderNames.Smtp);
        EmailMessage? captured = null;
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, _) => captured = m)
            .Returns(Task.CompletedTask);

        IOptionsMonitor<EmailNotificationOptions> options = BuildOptionsMonitor(
            new EmailNotificationOptions { PricingQuoteSalesInbox = "sales@archlucid.net" });

        MarketingEarlyAccessSalesNotifier sut = new(
            email.Object,
            options,
            NullLogger<MarketingEarlyAccessSalesNotifier>.Instance);

        await sut.NotifyAsync(SampleInsert, "buyer@example.com", "Contoso", "Architect\f", CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.HtmlBody.Should().Contain("Architect");
        captured.HtmlBody.Should().NotContain("\f");
    }

    private static IOptionsMonitor<EmailNotificationOptions> BuildOptionsMonitor(EmailNotificationOptions value)
    {
        Mock<IOptionsMonitor<EmailNotificationOptions>> mock = new();
        mock.Setup(x => x.CurrentValue).Returns(value);

        return mock.Object;
    }
}
