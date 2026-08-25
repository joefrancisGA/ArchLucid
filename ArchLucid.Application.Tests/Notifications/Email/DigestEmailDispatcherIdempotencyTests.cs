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

/// <summary>TB-089 — per-recipient ledger reservation after successful send so ACA retries do not duplicate digests.</summary>
[Trait("Category", "Unit")]
public sealed class DigestEmailDispatcherIdempotencyTests
{
    [Fact]
    public async Task ExecDigestEmailDispatcher_records_ledger_after_send()
    {
        List<string> order = [];
        Mock<ISentEmailLedger> ledger = new();
        ledger.Setup(l => l.IsRecordedAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        ledger.Setup(l => l.TryRecordSentAsync(It.IsAny<SentEmailLedgerEntry>(), It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("ledger"))
            .ReturnsAsync(true);

        Mock<IEmailProvider> provider = new();
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("send"))
            .Returns(Task.CompletedTask);

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("render"))
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
        order.Should().Equal("render", "send", "ledger");
    }

    [Fact]
    public async Task WeeklySponsorReportEmailDispatcher_records_ledger_after_send()
    {
        List<string> order = [];
        Mock<ISentEmailLedger> ledger = new();
        ledger.Setup(l => l.IsRecordedAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        ledger.Setup(l => l.TryRecordSentAsync(It.IsAny<SentEmailLedgerEntry>(), It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("ledger"))
            .ReturnsAsync(true);

        Mock<IEmailProvider> provider = new();
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("send"))
            .Returns(Task.CompletedTask);

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("render"))
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
        order.Should().Equal("render", "send", "ledger");
    }

    [Fact]
    public async Task WeeklySponsorReportEmailDispatcher_render_failure_does_not_block_retry()
    {
        InMemorySentEmailLedger ledger = new();
        int renderAttempts = 0;
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

        WeeklySponsorReportEmailDispatcher sut = new(
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<WeeklySponsorReportEmailDispatcher>.Instance);

        Guid tenantId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        const string isoWeek = "2026-W11";

        Func<Task> firstAttempt = () => sut.TryDispatchAsync(
            tenantId,
            isoWeek,
            runIdHex: "a1b2c3d4",
            summaryMarkdown: "summary",
            runDetailUrl: "https://example.test/runs/a1b2c3d4",
            weekLabel: "W11",
            toMailboxes: ["exec@example.test"],
            cancellationToken: CancellationToken.None);

        await firstAttempt.Should().ThrowAsync<InvalidOperationException>();

        bool secondAttempt = await sut.TryDispatchAsync(
            tenantId,
            isoWeek,
            runIdHex: "a1b2c3d4",
            summaryMarkdown: "summary",
            runDetailUrl: "https://example.test/runs/a1b2c3d4",
            weekLabel: "W11",
            toMailboxes: ["exec@example.test"],
            cancellationToken: CancellationToken.None);

        secondAttempt.Should().BeTrue("template render failures must not reserve the weekly ledger");
        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task WeeklySponsorReportEmailDispatcher_returns_false_when_all_mailboxes_blank()
    {
        InMemorySentEmailLedger ledger = new();
        Mock<IEmailProvider> provider = new();
        provider.SetupGet(p => p.ProviderName).Returns("test-provider");

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
            ledger,
            options.Object,
            NullLogger<WeeklySponsorReportEmailDispatcher>.Instance);

        bool sent = await sut.TryDispatchAsync(
            Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            "2026-W10",
            runIdHex: "a1b2c3d4",
            summaryMarkdown: "summary",
            runDetailUrl: "https://example.test/runs/a1b2c3d4",
            weekLabel: "W10",
            toMailboxes: [" ", "  "],
            cancellationToken: CancellationToken.None);

        sent.Should().BeFalse("blank recipient lists must not reserve the weekly ledger or report success");
        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
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
            .ReturnsAsync("<p>x</p>");
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
        sentMessages.Select(m => m.IdempotencyKey).Should().Contain(k => k.Contains("weekly-sponsor-report", StringComparison.Ordinal));
        sentMessages.Select(m => m.IdempotencyKey).Should().Contain(k => k.Contains("weekly-sponsor-summary", StringComparison.Ordinal));
    }

    [Fact]
    public async Task WeeklySponsorSummaryEmailDispatcher_subject_labels_summary_not_report()
    {
        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        const string isoWeek = "2026-W09";
        InMemorySentEmailLedger ledger = new();
        List<EmailMessage> sentMessages = [];

        Mock<IEmailProvider> provider = new();
        provider.SetupGet(p => p.ProviderName).Returns("test-provider");
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessages.Add(message))
            .Returns(Task.CompletedTask);

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("<p>x</p>");
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("x");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        WeeklySponsorSummaryEmailDispatcher summaryDispatcher = new(
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<WeeklySponsorSummaryEmailDispatcher>.Instance);

        bool summarySent = await summaryDispatcher.TryDispatchAsync(
            tenantId,
            isoWeek,
            runIdHex: "b1b2c3d4",
            summaryMarkdown: "summary body",
            runDetailUrl: "https://example.test/runs/b1b2c3d4",
            weekLabel: "W09",
            toMailboxes: ["exec@example.test"],
            cancellationToken: CancellationToken.None);

        summarySent.Should().BeTrue();
        sentMessages.Should().ContainSingle();
        sentMessages[0].Subject.Should().Contain("sponsor summary", "summary email must not reuse report subject copy");
        sentMessages[0].Subject.Should().NotContain("sponsor report");
    }

    [Fact]
    public async Task WeeklySponsorSummaryEmailDispatcher_records_ledger_after_render()
    {
        List<string> order = [];
        Mock<ISentEmailLedger> ledger = new();
        ledger.Setup(l => l.IsRecordedAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        ledger.Setup(l => l.TryRecordSentAsync(It.IsAny<SentEmailLedgerEntry>(), It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("ledger"))
            .ReturnsAsync(true);

        Mock<IEmailProvider> provider = new();
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("send"))
            .Returns(Task.CompletedTask);

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("render"))
            .ReturnsAsync("<p>x</p>");
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("x");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        WeeklySponsorSummaryEmailDispatcher sut = new(
            renderer.Object,
            provider.Object,
            ledger.Object,
            options.Object,
            NullLogger<WeeklySponsorSummaryEmailDispatcher>.Instance);

        bool sent = await sut.TryDispatchAsync(
            Guid.Parse("12121212-1212-1212-1212-121212121212"),
            "2026-W12",
            runIdHex: "a1b2c3d4",
            summaryMarkdown: "summary",
            runDetailUrl: "https://example.test/runs/a1b2c3d4",
            weekLabel: "W12",
            toMailboxes: ["exec@example.test"],
            cancellationToken: CancellationToken.None);

        sent.Should().BeTrue();
        order.Should().Equal("render", "send", "ledger");
    }

    [Fact]
    public async Task WeeklySponsorSummaryEmailDispatcher_render_failure_does_not_block_retry()
    {
        InMemorySentEmailLedger ledger = new();
        int renderAttempts = 0;
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

        WeeklySponsorSummaryEmailDispatcher sut = new(
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<WeeklySponsorSummaryEmailDispatcher>.Instance);

        Guid tenantId = Guid.Parse("13131313-1313-1313-1313-131313131313");
        const string isoWeek = "2026-W13";

        Func<Task> firstAttempt = () => sut.TryDispatchAsync(
            tenantId,
            isoWeek,
            runIdHex: "a1b2c3d4",
            summaryMarkdown: "summary",
            runDetailUrl: "https://example.test/runs/a1b2c3d4",
            weekLabel: "W13",
            toMailboxes: ["exec@example.test"],
            cancellationToken: CancellationToken.None);

        await firstAttempt.Should().ThrowAsync<InvalidOperationException>();

        bool secondAttempt = await sut.TryDispatchAsync(
            tenantId,
            isoWeek,
            runIdHex: "a1b2c3d4",
            summaryMarkdown: "summary",
            runDetailUrl: "https://example.test/runs/a1b2c3d4",
            weekLabel: "W13",
            toMailboxes: ["exec@example.test"],
            cancellationToken: CancellationToken.None);

        secondAttempt.Should().BeTrue("template render failures must not reserve the weekly ledger");
        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task WeeklySponsorSummaryEmailDispatcher_returns_false_when_all_mailboxes_blank()
    {
        InMemorySentEmailLedger ledger = new();
        Mock<IEmailProvider> provider = new();
        provider.SetupGet(p => p.ProviderName).Returns("test-provider");

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("<p>x</p>");
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("x");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        WeeklySponsorSummaryEmailDispatcher sut = new(
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<WeeklySponsorSummaryEmailDispatcher>.Instance);

        bool sent = await sut.TryDispatchAsync(
            Guid.Parse("14141414-1414-1414-1414-141414141414"),
            "2026-W14",
            runIdHex: "a1b2c3d4",
            summaryMarkdown: "summary",
            runDetailUrl: "https://example.test/runs/a1b2c3d4",
            weekLabel: "W14",
            toMailboxes: [" ", "  "],
            cancellationToken: CancellationToken.None);

        sent.Should().BeFalse("blank recipient lists must not reserve the weekly ledger or report success");
        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecDigestEmailDispatcher_render_failure_does_not_block_retry()
    {
        InMemorySentEmailLedger ledger = new();
        int renderAttempts = 0;
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

        ExecDigestEmailDispatcher sut = new(
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<ExecDigestEmailDispatcher>.Instance);

        Guid tenantId = Guid.Parse("15151515-1515-1515-1515-151515151515");
        const string isoWeek = "2026-W15";
        ExecDigestComposition composition = new(
            WeekLabel: "W15",
            ComplianceDriftMarkdown: null,
            CommittedManifestsInWeek: null,
            TopManifestRuns: [],
            FindingsDeltaSummary: null,
            DashboardUrl: "https://example.test/d",
            SponsorValueReportUrl: "https://example.test/sponsor",
            LatestCommittedRunIdHex: null);

        Func<Task> firstAttempt = () => sut.TryDispatchAsync(
            tenantId,
            isoWeek,
            composition,
            ["ops@example.test"],
            "https://example.test/unsub",
            CancellationToken.None);

        await firstAttempt.Should().ThrowAsync<InvalidOperationException>();

        bool secondAttempt = await sut.TryDispatchAsync(
            tenantId,
            isoWeek,
            composition,
            ["ops@example.test"],
            "https://example.test/unsub",
            CancellationToken.None);

        secondAttempt.Should().BeTrue("template render failures must not reserve the exec digest ledger");
        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecDigestEmailDispatcher_returns_false_when_all_mailboxes_blank()
    {
        InMemorySentEmailLedger ledger = new();
        Mock<IEmailProvider> provider = new();
        provider.SetupGet(p => p.ProviderName).Returns("test-provider");

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
            ledger,
            options.Object,
            NullLogger<ExecDigestEmailDispatcher>.Instance);

        bool sent = await sut.TryDispatchAsync(
            Guid.Parse("16161616-1616-1616-1616-161616161616"),
            "2026-W16",
            new ExecDigestComposition(
                WeekLabel: "W16",
                ComplianceDriftMarkdown: null,
                CommittedManifestsInWeek: null,
                TopManifestRuns: [],
                FindingsDeltaSummary: null,
                DashboardUrl: "https://example.test/d",
                SponsorValueReportUrl: "https://example.test/sponsor",
                LatestCommittedRunIdHex: null),
            [" ", "\t"],
            "https://example.test/unsub",
            CancellationToken.None);

        sent.Should().BeFalse();
        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecDigestEmailDispatcher_partial_multi_recipient_send_failure_delivers_remaining_recipients_on_retry()
    {
        InMemorySentEmailLedger ledger = new();
        Dictionary<string, int> sendCounts = new(StringComparer.OrdinalIgnoreCase);

        Mock<IEmailProvider> provider = new();
        provider.SetupGet(p => p.ProviderName).Returns("test-provider");
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Returns<EmailMessage, CancellationToken>((message, _) =>
            {
                sendCounts.TryGetValue(message.To, out int prior);
                sendCounts[message.To] = prior + 1;

                if (string.Equals(message.To, "b@example.test", StringComparison.OrdinalIgnoreCase) && prior == 0)
                    return Task.FromException(new InvalidOperationException("smtp down"));

                return Task.CompletedTask;
            });

        Mock<IEmailTemplateRenderer> renderer = new();
        renderer.Setup(r => r.RenderHtmlAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("<p>digest</p>");
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("digest");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        ExecDigestEmailDispatcher sut = new(
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<ExecDigestEmailDispatcher>.Instance);

        Guid tenantId = Guid.Parse("17171717-1717-1717-1717-171717171717");
        const string isoWeek = "2026-W17";
        ExecDigestComposition composition = new(
            WeekLabel: "W17",
            ComplianceDriftMarkdown: null,
            CommittedManifestsInWeek: null,
            TopManifestRuns: [],
            FindingsDeltaSummary: null,
            DashboardUrl: "https://example.test/d",
            SponsorValueReportUrl: "https://example.test/sponsor",
            LatestCommittedRunIdHex: null);

        Func<Task> firstAttempt = () => sut.TryDispatchAsync(
            tenantId,
            isoWeek,
            composition,
            ["a@example.test", "b@example.test"],
            "https://example.test/unsub",
            CancellationToken.None);

        await firstAttempt.Should().ThrowAsync<InvalidOperationException>();

        bool secondAttempt = await sut.TryDispatchAsync(
            tenantId,
            isoWeek,
            composition,
            ["a@example.test", "b@example.test"],
            "https://example.test/unsub",
            CancellationToken.None);

        secondAttempt.Should().BeTrue("partial multi-recipient failures must not permanently suppress remaining digest recipients");
        sendCounts["b@example.test"].Should().Be(2);
        sendCounts.Should().ContainKey("a@example.test");
    }
}
