using ArchLucid.Application.Notifications.Email;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Category", "Unit")]
public sealed class MultiRecipientEmailDispatchTests
{
    [Fact]
    public async Task Send_completed_before_cancellation_is_recorded_without_sending_to_next_mailbox()
    {
        using CancellationTokenSource cancellation = new();
        Guid tenantId = Guid.NewGuid();
        const string firstMailbox = "first@example.com";
        const string firstKey = "digest:first@example.com";

        Mock<ISentEmailLedger> ledger = new(MockBehavior.Strict);
        ledger.Setup(l => l.IsRecordedAsync(tenantId, firstKey, cancellation.Token)).ReturnsAsync(false);
        ledger.Setup(l => l.TryRecordSentAsync(
                It.Is<SentEmailLedgerEntry>(entry => entry.IdempotencyKey == firstKey && entry.TenantId == tenantId),
                CancellationToken.None))
            .ReturnsAsync(true);

        Mock<IEmailProvider> provider = new();
        provider.SetupGet(p => p.ProviderName).Returns("test");
        provider.Setup(p => p.SendAsync(It.IsAny<EmailMessage>(), cancellation.Token))
            .Callback(() => cancellation.Cancel())
            .Returns(Task.CompletedTask);

        Func<Task> dispatch = () => MultiRecipientEmailDispatch.TrySendToMailboxesAsync(
            tenantId,
            "digest",
            "template",
            [firstMailbox, "second@example.com"],
            ledger.Object,
            provider.Object,
            mailbox => new EmailMessage
            {
                To = mailbox,
                Subject = "digest",
                HtmlBody = "digest",
                IdempotencyKey = MultiRecipientEmailDispatch.BuildMailboxIdempotencyKey("digest", mailbox),
            },
            null,
            cancellation.Token);

        await dispatch.Should().ThrowAsync<OperationCanceledException>();

        ledger.Verify(l => l.TryRecordSentAsync(It.IsAny<SentEmailLedgerEntry>(), CancellationToken.None), Times.Once);
        provider.Verify(p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
