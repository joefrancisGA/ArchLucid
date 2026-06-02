using ArchLucid.Application.ExecDigest;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Notifications.Email.Models;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;

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
                SponsorValueReportUrl: "https://example.test/sponsor"),
            ["ops@example.test"],
            "https://example.test/unsub",
            CancellationToken.None);

        sent.Should().BeTrue();
        order.Should().Equal("ledger", "send");
    }

    [Fact]
    public async Task WeeklyExecutiveSummaryEmailDispatcher_records_ledger_before_send()
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

        WeeklyExecutiveSummaryEmailDispatcher sut = new(
            renderer.Object,
            provider.Object,
            ledger.Object,
            options.Object,
            NullLogger<WeeklyExecutiveSummaryEmailDispatcher>.Instance);

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
}
