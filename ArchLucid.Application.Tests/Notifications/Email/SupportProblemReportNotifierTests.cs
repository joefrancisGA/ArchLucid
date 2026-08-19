using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Support;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Core.Support;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Application")]
[Trait("Category", "Unit")]
public sealed class SupportProblemReportNotifierTests
{
    private static readonly Guid ReportId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly DateTimeOffset CreatedUtc = new(2026, 7, 17, 12, 0, 0, TimeSpan.Zero);

    [SkippableFact]
    public async Task NotifySubmitterAsync_sends_ack_with_reference_sla_and_settings_link()
    {
        Mock<IEmailProvider> email = new();
        email.Setup(x => x.ProviderName).Returns("test");

        EmailMessage? captured = null;
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => captured = message)
            .Returns(Task.CompletedTask);

        IOptionsMonitor<EmailNotificationOptions> options = BuildOptions(
            new EmailNotificationOptions
            {
                ProductDisplayName = "ArchLucid",
                OperatorBaseUrl = "https://app.example.com"
            });

        SupportProblemReportNotifier sut = new(
            email.Object,
            options,
            NullLogger<SupportProblemReportNotifier>.Instance);

        SupportProblemReportRecord report = BuildReport();

        await sut.NotifySubmitterAsync(report, "operator@example.com", CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.To.Should().Be("operator@example.com");
        captured.Subject.Should().Contain(ReportId.ToString("D"));
        captured.TextBody.Should().Contain(SupportProblemReportCopy.SlaMessage);
        captured.TextBody.Should().Contain(SupportProblemReportCopy.WhatToExpectMessage);
        captured.TextBody.Should().Contain("https://app.example.com/administration/support");
        captured.HtmlBody.Should().Contain("next business day");
    }

    [SkippableFact]
    public async Task NotifySupportInboxAsync_uses_reference_id_in_subject()
    {
        Mock<IEmailProvider> email = new();
        email.Setup(x => x.ProviderName).Returns("test");

        IOptionsMonitor<EmailNotificationOptions> options = BuildOptions(
            new EmailNotificationOptions { SupportInbox = "support@example.com" });

        SupportProblemReportNotifier sut = new(
            email.Object,
            options,
            NullLogger<SupportProblemReportNotifier>.Instance);

        await sut.NotifySupportInboxAsync(BuildReport(), "jwt:t1:oid", false, CancellationToken.None);

        email.Verify(
            x => x.SendAsync(
                It.Is<EmailMessage>(m =>
                    m.To == "support@example.com"
                    && m.Subject == $"[ArchLucid] Report {ReportId:D}"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static SupportProblemReportRecord BuildReport()
    {
        return new SupportProblemReportRecord
        {
            Id = ReportId,
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            SubmittedByActorId = "actor-1",
            ContextJson = "{}",
            Status = SupportProblemReportStatus.Open,
            CreatedUtc = CreatedUtc
        };
    }

    private static IOptionsMonitor<EmailNotificationOptions> BuildOptions(EmailNotificationOptions value)
    {
        Mock<IOptionsMonitor<EmailNotificationOptions>> monitor = new();
        monitor.Setup(x => x.CurrentValue).Returns(value);

        return monitor.Object;
    }
}
