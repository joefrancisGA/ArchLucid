using ArchLucid.Application.Identity;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class EmailOtpEmailNotifierTests
{
    [SkippableFact]
    public async Task TrySendSignInCodeAsync_uses_distinct_idempotency_keys_for_different_codes_in_same_minute()
    {
        List<EmailMessage> sentMessages = [];
        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessages.Add(message))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(x => x.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "Prod" });

        EmailOtpEmailNotifier sut = new(
            email.Object,
            options.Object,
            NullLogger<EmailOtpEmailNotifier>.Instance);

        await sut.TrySendSignInCodeAsync("user@example.com", "111111", 10, CancellationToken.None);
        await sut.TrySendSignInCodeAsync("user@example.com", "222222", 10, CancellationToken.None);

        sentMessages.Should().HaveCount(2);
        sentMessages[0].IdempotencyKey.Should().NotBe(sentMessages[1].IdempotencyKey);
    }

    [SkippableFact]
    public async Task TrySendSignInCodeAsync_reuses_idempotency_key_when_resending_same_code()
    {
        List<EmailMessage> sentMessages = [];
        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessages.Add(message))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(x => x.CurrentValue).Returns(new EmailNotificationOptions { ProductDisplayName = "Prod" });

        EmailOtpEmailNotifier sut = new(
            email.Object,
            options.Object,
            NullLogger<EmailOtpEmailNotifier>.Instance);

        await sut.TrySendSignInCodeAsync("user@example.com", "111111", 10, CancellationToken.None);
        await sut.TrySendSignInCodeAsync("user@example.com", "111111", 10, CancellationToken.None);

        sentMessages.Should().HaveCount(2);
        sentMessages[0].IdempotencyKey.Should().Be(sentMessages[1].IdempotencyKey);
    }
}
