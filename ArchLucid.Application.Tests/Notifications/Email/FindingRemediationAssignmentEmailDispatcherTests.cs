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
public sealed class FindingRemediationAssignmentEmailDispatcherTests
{
    [Fact]
    public async Task TryDispatchAsync_send_failure_after_ledger_reservation_throws_so_retry_can_deliver()
    {
        InMemorySentEmailLedger ledger = new();
        int sendAttempts = 0;

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
            .ReturnsAsync("<p>assigned</p>");
        renderer.Setup(r => r.RenderTextAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("assigned");

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "ArchLucid" });

        FindingRemediationAssignmentEmailDispatcher sut = new(
            renderer.Object,
            provider.Object,
            ledger,
            options.Object,
            NullLogger<FindingRemediationAssignmentEmailDispatcher>.Instance);

        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        const string findingId = "finding-1";

        Func<Task> firstAttempt = () => sut.TryDispatchAsync(
            tenantId,
            runId,
            findingId,
            "Open ingress",
            "assignee@example.test",
            remediationDueUtc: null,
            cancellationToken: CancellationToken.None);

        await firstAttempt.Should().ThrowAsync<InvalidOperationException>();

        bool secondAttempt = await sut.TryDispatchAsync(
            tenantId,
            runId,
            findingId,
            "Open ingress",
            "assignee@example.test",
            remediationDueUtc: null,
            cancellationToken: CancellationToken.None);

        secondAttempt.Should().BeTrue("transient send failures must not permanently suppress remediation notifications");
        sendAttempts.Should().Be(2);
    }
}
