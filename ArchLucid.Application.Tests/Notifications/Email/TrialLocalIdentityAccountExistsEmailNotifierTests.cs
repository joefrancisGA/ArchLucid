using ArchLucid.Application.Identity;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TrialLocalIdentityAccountExistsEmailNotifierTests
{
    [Fact]
    public async Task NotifyAccountAlreadyExistsAsync_when_send_fails_logs_fingerprint_not_raw_address()
    {
        const string rawRecipient = "PrivateVictim@Example.COM";
        string fingerprint = TrialEmailCorrelationFingerprint.ComputeHexPrefix(rawRecipient);

        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("smtp fault"));

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(x => x.CurrentValue).Returns(new EmailNotificationOptions());

        Mock<ILogger<TrialLocalIdentityAccountExistsEmailNotifier>> logger = new();
        logger.Setup(l => l.IsEnabled(LogLevel.Warning)).Returns(true);

        string? rendered = null;

        logger.Setup(m => m.Log(
                It.IsAny<LogLevel>(),
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
            .Callback(new InvocationAction(invocation =>
            {
                Delegate formatter = (Delegate)invocation.Arguments[4];
                object state = invocation.Arguments[2];
                object ex = invocation.Arguments[3];
                rendered = formatter.DynamicInvoke(state, ex) as string;
            }));

        TrialLocalIdentityAccountExistsEmailNotifier sut = new(
            email.Object,
            options.Object,
            logger.Object);

        Func<Task> act = async () => await sut.NotifyAccountAlreadyExistsAsync(rawRecipient, CancellationToken.None);

        await act.Should().NotThrowAsync();

        rendered.Should().NotBeNull();
        string text = rendered!;

        text.Should().Contain(fingerprint);
        text.Should().Contain("recipientCorrelation=");
        text.Should().NotContain("PrivateVictim");
        text.Should().NotContain("example.com");
    }

    [Fact]
    public async Task NotifyAccountAlreadyExistsAsync_when_send_succeeds_does_not_log_warning()
    {
        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<EmailNotificationOptions>> options = new();
        options.Setup(x => x.CurrentValue).Returns(new EmailNotificationOptions());

        Mock<ILogger<TrialLocalIdentityAccountExistsEmailNotifier>> logger = new();

        TrialLocalIdentityAccountExistsEmailNotifier sut = new(
            email.Object,
            options.Object,
            logger.Object);

        await sut.NotifyAccountAlreadyExistsAsync("ok@example.com", CancellationToken.None);

        logger.Verify(
            x => x.Log(
                It.IsAny<LogLevel>(),
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Never);
    }
}
