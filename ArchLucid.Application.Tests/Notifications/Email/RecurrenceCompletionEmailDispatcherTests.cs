using ArchLucid.Application.Notifications.Email;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Persistence.Notifications;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Category", "Unit")]
public sealed class RecurrenceCompletionEmailDispatcherTests
{
    [Fact]
    public async Task TryDispatchAsync_records_ledger_after_render()
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
            .Callback(() => order.Add("render"))
            .ReturnsAsync("<p>x</p>");
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("x");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        RecurrenceCompletionEmailDispatcher sut = new(
            renderer.Object,
            provider.Object,
            ledger.Object,
            options.Object,
            NullLogger<RecurrenceCompletionEmailDispatcher>.Instance);

        Guid tenantId = Guid.Parse("17171717-1717-1717-1717-171717171717");
        Guid scheduleId = Guid.Parse("18181818-1818-1818-1818-181818181818");
        Guid triggeredRunId = Guid.Parse("19191919-1919-1919-1919-191919191919");
        Guid sourceRunId = Guid.Parse("1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a");

        bool sent = await sut.TryDispatchAsync(
            tenantId,
            scheduleId,
            triggeredRunId,
            scheduleName: "Weekly scan",
            newFindingCount: 2,
            resolvedFindingCount: 1,
            sourceRunId,
            ["ops@example.test"],
            CancellationToken.None);

        sent.Should().BeTrue();
        order.Should().Equal("render", "ledger", "send");
    }

    [Fact]
    public async Task TryDispatchAsync_render_failure_does_not_block_retry()
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

        RecurrenceCompletionEmailDispatcher sut = new(
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<RecurrenceCompletionEmailDispatcher>.Instance);

        Guid tenantId = Guid.Parse("21212121-2121-2121-2121-212121212121");
        Guid scheduleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid triggeredRunId = Guid.Parse("23232323-2323-2323-2323-232323232323");
        Guid sourceRunId = Guid.Parse("24242424-2424-2424-2424-242424242424");

        Func<Task> firstAttempt = () => sut.TryDispatchAsync(
            tenantId,
            scheduleId,
            triggeredRunId,
            scheduleName: "Weekly scan",
            newFindingCount: 1,
            resolvedFindingCount: 0,
            sourceRunId,
            ["ops@example.test"],
            CancellationToken.None);

        await firstAttempt.Should().ThrowAsync<InvalidOperationException>();

        bool secondAttempt = await sut.TryDispatchAsync(
            tenantId,
            scheduleId,
            triggeredRunId,
            scheduleName: "Weekly scan",
            newFindingCount: 1,
            resolvedFindingCount: 0,
            sourceRunId,
            ["ops@example.test"],
            CancellationToken.None);

        secondAttempt.Should().BeTrue("template render failures must not reserve the recurrence completion ledger");
        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryDispatchAsync_returns_false_when_all_mailboxes_blank()
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

        RecurrenceCompletionEmailDispatcher sut = new(
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<RecurrenceCompletionEmailDispatcher>.Instance);

        bool sent = await sut.TryDispatchAsync(
            Guid.Parse("25252525-2525-2525-2525-252525252525"),
            Guid.Parse("26262626-2626-2626-2626-262626262626"),
            Guid.Parse("27272727-2727-2727-2727-272727272727"),
            scheduleName: "Weekly scan",
            newFindingCount: 1,
            resolvedFindingCount: 0,
            Guid.Parse("28282828-2828-2828-2828-282828282828"),
            [" ", ""],
            CancellationToken.None);

        sent.Should().BeFalse();
        provider.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
