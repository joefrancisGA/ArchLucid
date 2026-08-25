using ArchLucid.Application.Notifications.Email;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class UserInvitationEmailNotifierTests
{
    private const string AcceptUrl = "https://app.example.com/auth/invite?token=stable-invite-token";

    [SkippableFact]
    public async Task TrySendInvitationAsync_uses_stable_idempotency_key_for_same_invitation()
    {
        List<EmailMessage> sentMessages = [];
        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessages.Add(message))
            .Returns(Task.CompletedTask);

        IOptionsMonitor<EmailNotificationOptions> options = BuildOptions(new EmailNotificationOptions
        {
            ProductDisplayName = "Prod",
        });

        UserInvitationEmailNotifier sut = new(
            email.Object,
            options,
            NullLogger<UserInvitationEmailNotifier>.Instance);

        await sut.TrySendInvitationAsync(
            "invitee@example.com",
            AcceptUrl,
            "Reader",
            14,
            null,
            CancellationToken.None);

        await sut.TrySendInvitationAsync(
            "invitee@example.com",
            AcceptUrl,
            "Reader",
            14,
            null,
            CancellationToken.None);

        sentMessages.Should().HaveCount(2);
        sentMessages[0].IdempotencyKey.Should().Be(sentMessages[1].IdempotencyKey);
        sentMessages[0].IdempotencyKey.Should().Contain("stable-invite-token");
        sentMessages[0].IdempotencyKey.Should().NotMatchRegex("[0-9a-f]{32}");
    }

    private static IOptionsMonitor<EmailNotificationOptions> BuildOptions(EmailNotificationOptions value)
    {
        Mock<IOptionsMonitor<EmailNotificationOptions>> mock = new();
        mock.Setup(x => x.CurrentValue).Returns(value);

        return mock.Object;
    }
}
