using ArchLucid.Application.ExecDigest;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Notifications.Email.Models;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Persistence.Notifications;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Notifications.Email;

/// <summary>TB-089 — ledger reservation must precede outbound send so ACA retries do not duplicate digests.</summary>
[Trait("Category", "Unit")]
public sealed class DigestEmailDispatcherIdempotencyTests
{
    [Fact]
    public async Task ExecDigestEmailDispatcher_records_ledger_before_send()
    {
        List<string> order = [];
        Mock<ISentEmailLedger> ledger = new();
        ledger.Setup(l => l.TryRecordSentAsync(It.IsAny<SentEmailLedgerEntry>(), It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("ledger"))
            .ReturnsAsync(true);

        Mock<IEmailProvider> provider = new();
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("send"))
            .Returns(Task.CompletedTask);

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("<p>x</p>");
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("x");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        ExecDigestEmailDispatcher sut = new(
            renderer.Object,
            provider.Object,
            ledger.Object,
            options.Object,
            NullLogger<ExecDigestEmailDispatcher>.Instance);

        bool sent = await sut.TryDispatchAsync(
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            "2026-W01",
            new ExecDigestComposition(
                WeekLabel: "W01",
                ComplianceDriftMarkdown: null,
                CommittedManifestsInWeek: null,
                TopManifestRuns: [],
                FindingsDeltaSummary: null,
                DashboardUrl: "https://example.test/d",
                SponsorValueReportUrl: "https://example.test/sponsor",
                LatestCommittedRunIdHex: null),
            ["ops@example.test"],
            "https://example.test/unsub",
            CancellationToken.None);

        sent.Should().BeTrue();
        order.Should().Equal("ledger", "send");
    }

    [Fact]
    public async Task WeeklySponsorReportEmailDispatcher_records_ledger_before_send()
    {
        List<string> order = [];
        Mock<ISentEmailLedger> ledger = new();
        ledger.Setup(l => l.TryRecordSentAsync(It.IsAny<SentEmailLedgerEntry>(), It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("ledger"))
            .ReturnsAsync(true);

        Mock<IEmailProvider> provider = new();
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("send"))
            .Returns(Task.CompletedTask);

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("<p>x</p>");
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("x");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        WeeklySponsorReportEmailDispatcher sut = new(
            renderer.Object,
            provider.Object,
            ledger.Object,
            options.Object,
            NullLogger<WeeklySponsorReportEmailDispatcher>.Instance);

        bool sent = await sut.TryDispatchAsync(
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            "2026-W01",
            runIdHex: "a1b2c3d4",
            summaryMarkdown: "summary",
            runDetailUrl: "https://example.test/runs/a1b2c3d4",
            weekLabel: "W01",
            toMailboxes: ["exec@example.test"],
            cancellationToken: CancellationToken.None);

        sent.Should().BeTrue();
        order.Should().Equal("ledger", "send");
    }

    [Fact]
    public async Task WeeklySponsorSummaryEmailDispatcher_uses_distinct_idempotency_key_from_weekly_sponsor_report()
    {
        Guid tenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        const string isoWeek = "2026-W08";
        InMemorySentEmailLedger ledger = new();
        List<EmailMessage> sentMessages = [];

        Mock<IEmailProvider> provider = new();
        provider.SetupGet(p => p.ProviderName).Returns("test-provider");
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessages.Add(message))
            .Returns(Task.CompletedTask);

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .Returns<string, object, CancellationToken>((_, model, _) =>
                model is WeeklySponsorSummaryEmailModel summary
                    ? Task.FromResult(summary.SummaryMarkdown)
                    : Task.FromResult("<p>x</p>"));
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("x");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        WeeklySponsorReportEmailDispatcher reportDispatcher = new(
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<WeeklySponsorReportEmailDispatcher>.Instance);

        WeeklySponsorSummaryEmailDispatcher summaryDispatcher = new(
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<WeeklySponsorSummaryEmailDispatcher>.Instance);

        bool reportSent = await reportDispatcher.TryDispatchAsync(
            tenantId,
            isoWeek,
            runIdHex: "a1b2c3d4",
            summaryMarkdown: "report body",
            runDetailUrl: "https://example.test/runs/a1b2c3d4",
            weekLabel: "W08",
            toMailboxes: ["exec@example.test"],
            cancellationToken: CancellationToken.None);

        bool summarySent = await summaryDispatcher.TryDispatchAsync(
            tenantId,
            isoWeek,
            runIdHex: "a1b2c3d4",
            summaryMarkdown: "summary body",
            runDetailUrl: "https://example.test/runs/a1b2c3d4",
            weekLabel: "W08",
            toMailboxes: ["exec@example.test"],
            cancellationToken: CancellationToken.None);

        reportSent.Should().BeTrue();
        summarySent.Should().BeTrue("distinct weekly email classes must not share one tenant/week ledger key");
        sentMessages.Should().HaveCount(2);
        sentMessages.Select(m => m.HtmlBody).Should().Contain("summary body");
    }
}
