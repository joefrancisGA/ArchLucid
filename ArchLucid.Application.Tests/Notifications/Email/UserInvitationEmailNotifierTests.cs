using ArchLucid.Application.Notifications.Email;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
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

    [SkippableFact]
    public async Task TrySendInvitationAsync_renders_markdown_links_in_personal_message()
    {
        EmailMessage? sentMessage = null;
        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessage = message)
            .Returns(Task.CompletedTask);

        UserInvitationEmailNotifier sut = new(
            email.Object,
            BuildOptions(new EmailNotificationOptions { ProductDisplayName = "Prod" }),
            NullLogger<UserInvitationEmailNotifier>.Instance);

        const string personalMessage =
            "Please review the finalized architecture review [Retail API platform](https://app.example.com/architecture/reviews/run-abc).";

        await sut.TrySendInvitationAsync(
            "invitee@example.com",
            AcceptUrl,
            "Reader",
            14,
            personalMessage,
            CancellationToken.None);

        sentMessage.Should().NotBeNull();
        sentMessage!.HtmlBody.Should().Contain(
            "<a href=\"https://app.example.com/architecture/reviews/run-abc\" rel=\"noopener noreferrer\">Retail API platform</a>");
        sentMessage.TextBody.Should().Contain(
            "Retail API platform (https://app.example.com/architecture/reviews/run-abc)");
        sentMessage.TextBody.Should().NotContain("[Retail API platform]");
    }

    [SkippableFact]
    public async Task TrySendInvitationAsync_omits_user_info_from_accept_url_in_message_bodies()
    {
        EmailMessage? sentMessage = null;
        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessage = message)
            .Returns(Task.CompletedTask);

        UserInvitationEmailNotifier sut = new(
            email.Object,
            BuildOptions(new EmailNotificationOptions { ProductDisplayName = "Prod" }),
            NullLogger<UserInvitationEmailNotifier>.Instance);

        const string acceptUrlWithUserInfo =
            "https://user:secret@ops.example.test/auth/invite?token=stable-invite-token";

        await sut.TrySendInvitationAsync(
            "invitee@example.com",
            acceptUrlWithUserInfo,
            "Reader",
            14,
            null,
            CancellationToken.None);

        sentMessage.Should().NotBeNull();
        const string expectedAcceptUrl =
            "https://ops.example.test/auth/invite?token=stable-invite-token";
        sentMessage!.HtmlBody.Should().Contain(expectedAcceptUrl);
        sentMessage.TextBody.Should().Contain(expectedAcceptUrl);
        sentMessage.HtmlBody.Should().NotContain("user:secret@");
        sentMessage.TextBody.Should().NotContain("user:secret@");
    }

    [SkippableFact]
    public async Task TrySendInvitationAsync_rejects_recipient_mailbox_with_embedded_line_breaks()
    {
        EmailMessage? sentMessage = null;
        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessage = message)
            .Returns(Task.CompletedTask);

        UserInvitationEmailNotifier sut = new(
            email.Object,
            BuildOptions(new EmailNotificationOptions { ProductDisplayName = "Prod" }),
            NullLogger<UserInvitationEmailNotifier>.Instance);

        bool sent = await sut.TrySendInvitationAsync(
            "invitee@example.com\r\nBcc: injected@evil.test",
            AcceptUrl,
            "Reader",
            14,
            null,
            CancellationToken.None);

        sent.Should().BeFalse();
        sentMessage.Should().BeNull();
        email.Verify(
            p => p.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TrySendInvitationAsync_omits_line_breaks_from_product_display_name_in_subject()
    {
        EmailMessage? sentMessage = null;
        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessage = message)
            .Returns(Task.CompletedTask);

        UserInvitationEmailNotifier sut = new(
            email.Object,
            BuildOptions(new EmailNotificationOptions { ProductDisplayName = "Prod\r\nBcc: injected@evil.test" }),
            NullLogger<UserInvitationEmailNotifier>.Instance);

        await sut.TrySendInvitationAsync(
            "invitee@example.com",
            AcceptUrl,
            "Reader",
            14,
            null,
            CancellationToken.None);

        sentMessage.Should().NotBeNull();
        sentMessage!.Subject.Should().Be("You're invited to Prod Bcc: injected@evil.test");
        sentMessage.Subject.Should().NotContain("\r");
        sentMessage.Subject.Should().NotContain("\n");
    }

    [SkippableFact]
    public async Task TrySendInvitationAsync_omits_user_info_from_plain_http_url_in_personal_message()
    {
        EmailMessage? sentMessage = null;
        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessage = message)
            .Returns(Task.CompletedTask);

        UserInvitationEmailNotifier sut = new(
            email.Object,
            BuildOptions(new EmailNotificationOptions { ProductDisplayName = "Prod" }),
            NullLogger<UserInvitationEmailNotifier>.Instance);

        const string personalMessage =
            "Use this link: https://user:secret@ops.example.test/architecture/reviews/run-abc";

        await sut.TrySendInvitationAsync(
            "invitee@example.com",
            AcceptUrl,
            "Reader",
            14,
            personalMessage,
            CancellationToken.None);

        sentMessage.Should().NotBeNull();
        const string expectedUrl = "https://ops.example.test/architecture/reviews/run-abc";
        sentMessage!.HtmlBody.Should().Contain(expectedUrl);
        sentMessage.TextBody.Should().Contain(expectedUrl);
        sentMessage.HtmlBody.Should().NotContain("user:secret@");
        sentMessage.TextBody.Should().NotContain("user:secret@");
    }

    [SkippableFact]
    public async Task TrySendInvitationAsync_strips_embedded_crlf_from_personal_message_in_text_body()
    {
        EmailMessage? sentMessage = null;
        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessage = message)
            .Returns(Task.CompletedTask);

        UserInvitationEmailNotifier sut = new(
            email.Object,
            BuildOptions(new EmailNotificationOptions { ProductDisplayName = "Prod" }),
            NullLogger<UserInvitationEmailNotifier>.Instance);

        const string injectedLine = "Bcc: injected@evil.test";
        string personalMessage = $"Welcome aboard\r\n{injectedLine}";

        await sut.TrySendInvitationAsync(
            "invitee@example.com",
            AcceptUrl,
            "Reader",
            14,
            personalMessage,
            CancellationToken.None);

        sentMessage.Should().NotBeNull();
        sentMessage!.TextBody.Should().NotContain($"\r\n{injectedLine}");
        sentMessage.TextBody.Should().NotContain($"\n{injectedLine}");
        sentMessage.TextBody.Should().Contain("Welcome aboard");
    }

    [SkippableFact]
    public async Task TrySendInvitationAsync_omits_user_info_from_personal_message_markdown_link_urls()
    {
        EmailMessage? sentMessage = null;
        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessage = message)
            .Returns(Task.CompletedTask);

        UserInvitationEmailNotifier sut = new(
            email.Object,
            BuildOptions(new EmailNotificationOptions { ProductDisplayName = "Prod" }),
            NullLogger<UserInvitationEmailNotifier>.Instance);

        const string personalMessage =
            "See [run details](https://user:secret@ops.example.test/architecture/reviews/run-abc).";

        await sut.TrySendInvitationAsync(
            "invitee@example.com",
            AcceptUrl,
            "Reader",
            14,
            personalMessage,
            CancellationToken.None);

        sentMessage.Should().NotBeNull();
        sentMessage!.HtmlBody.Should().Contain(
            "<a href=\"https://ops.example.test/architecture/reviews/run-abc\" rel=\"noopener noreferrer\">run details</a>");
        sentMessage.TextBody.Should().Contain(
            "run details (https://ops.example.test/architecture/reviews/run-abc)");
        sentMessage.HtmlBody.Should().NotContain("user:secret@");
        sentMessage.TextBody.Should().NotContain("user:secret@");
    }

    [SkippableTheory]
    [InlineData("javascript:alert(1)")]
    [InlineData("data:text/html;base64,PGI+")]
    [InlineData("not a valid uri")]
    public async Task TrySendInvitationAsync_renders_invalid_markdown_link_schemes_as_plain_text(string unsafeUrl)
    {
        EmailMessage? sentMessage = null;
        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessage = message)
            .Returns(Task.CompletedTask);

        UserInvitationEmailNotifier sut = new(
            email.Object,
            BuildOptions(new EmailNotificationOptions { ProductDisplayName = "Prod" }),
            NullLogger<UserInvitationEmailNotifier>.Instance);

        string personalMessage = $"Click [here]({unsafeUrl}) for details.";

        await sut.TrySendInvitationAsync(
            "invitee@example.com",
            AcceptUrl,
            "Reader",
            14,
            personalMessage,
            CancellationToken.None);

        sentMessage.Should().NotBeNull();

        string encodedUrl = System.Net.WebUtility.HtmlEncode(unsafeUrl);
        sentMessage!.HtmlBody.Should().NotContain($"<a href=\"{encodedUrl}\"");
        sentMessage.HtmlBody.Should().Contain($"here ({encodedUrl})");
    }

    [SkippableFact]
    public async Task TrySendInvitationAsync_strips_vertical_tab_from_app_role_in_html_and_text_bodies()
    {
        EmailMessage? sentMessage = null;
        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessage = message)
            .Returns(Task.CompletedTask);

        UserInvitationEmailNotifier sut = new(
            email.Object,
            BuildOptions(new EmailNotificationOptions { ProductDisplayName = "Prod" }),
            NullLogger<UserInvitationEmailNotifier>.Instance);

        await sut.TrySendInvitationAsync(
            "invitee@example.com",
            AcceptUrl,
            "Reader\u000B",
            14,
            personalMessage: null,
            CancellationToken.None);

        sentMessage.Should().NotBeNull();
        sentMessage!.HtmlBody.Should().Contain("Reader");
        sentMessage.HtmlBody.Should().NotContain("\u000B");
        sentMessage.TextBody.Should().Contain("Reader");
        sentMessage.TextBody.Should().NotContain("\u000B");
    }

    [SkippableFact]
    public async Task TrySendInvitationAsync_strips_form_feed_from_personal_message_in_html_body()
    {
        EmailMessage? sentMessage = null;
        Mock<IEmailProvider> email = new();
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessage = message)
            .Returns(Task.CompletedTask);

        UserInvitationEmailNotifier sut = new(
            email.Object,
            BuildOptions(new EmailNotificationOptions { ProductDisplayName = "Prod" }),
            NullLogger<UserInvitationEmailNotifier>.Instance);

        await sut.TrySendInvitationAsync(
            "invitee@example.com",
            AcceptUrl,
            "Reader",
            14,
            "Welcome\faboard",
            CancellationToken.None);

        sentMessage.Should().NotBeNull();
        sentMessage!.HtmlBody.Should().Contain("Welcome aboard");
        sentMessage.HtmlBody.Should().NotContain("\f");
        sentMessage.TextBody.Should().NotContain("\f");
    }

    private static IOptionsMonitor<EmailNotificationOptions> BuildOptions(EmailNotificationOptions value)
    {
        Mock<IOptionsMonitor<EmailNotificationOptions>> mock = new();
        mock.Setup(x => x.CurrentValue).Returns(value);

        return mock.Object;
    }
}
