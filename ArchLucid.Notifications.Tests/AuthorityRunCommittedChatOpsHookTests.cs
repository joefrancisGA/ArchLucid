using ArchLucid.Notifications;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Notifications.Tests;

[Trait("Category", "Unit")]
public sealed class AuthorityRunCommittedChatOpsHookTests
{
    [Fact]
    public async Task NotifyAsync_calls_slack_and_teams_when_configured_with_https_urls()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        delivery.Setup(d =>
                d.DeliverAsync(
                    It.IsAny<ChatOpsWebhookTarget>(),
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Returns(Task.CompletedTask);

        ChatOpsIncomingWebhooksOptions opts = new()
        {
            SlackNotifyOnAuthorityRunCompleted = true,
            SlackIncomingWebhookAbsoluteUri = " https://hooks.slack.com/services/X/Y/Z ",
            TeamsNotifyOnAuthorityRunCompleted = true,
            TeamsIncomingWebhookAbsoluteUri = "https://outlook.office.com/webhook/abc",
        };

        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(opts);

        AuthorityRunCommittedChatOpsHook sut = new(
            delivery.Object,
            optionsMonitor.Object,
            Mock.Of<ILogger<AuthorityRunCommittedChatOpsHook>>());

        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        Guid runId = Guid.Parse("11111111-2222-3333-4444-555555555555");

        AuthorityRunCommittedChatOpsNotice notice = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            RunId = runId,
            FindingCount = 2,
            Description = "  Done  ",
        };

        await sut.NotifyAsync(notice, CancellationToken.None);

        delivery.Verify(
            d => d.DeliverAsync(
                ChatOpsWebhookTarget.Slack,
                "https://hooks.slack.com/services/X/Y/Z",
                It.Is<ChatOpsWebhookMessage>(m =>
                    m.Title == "Authority run completed (2 findings)"
                    && m.SupportingParagraph == $"Run `{runId:D}`"
                    && m.Body == "Done"),
                It.IsAny<CancellationToken>(),
                It.Is<WebhookPostOptions?>(t =>
                    t != null
                    && t.EventType == "chatOps.architectureAuthorityRun.completed"
                    && t.TenantId == tenantId)),
            Times.Once);

        delivery.Verify(
            d => d.DeliverAsync(
                ChatOpsWebhookTarget.Teams,
                "https://outlook.office.com/webhook/abc",
                It.IsAny<ChatOpsWebhookMessage>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<WebhookPostOptions?>()),
            Times.Once);
    }

    [Fact]
    public async Task NotifyAsync_uses_singular_finding_word_when_count_is_one()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        delivery.Setup(d =>
                d.DeliverAsync(
                    It.IsAny<ChatOpsWebhookTarget>(),
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Returns(Task.CompletedTask);

        ChatOpsIncomingWebhooksOptions opts = new()
        {
            SlackNotifyOnAuthorityRunCompleted = true,
            SlackIncomingWebhookAbsoluteUri = "https://hooks.slack.com/services/X/Y/Z",
        };

        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(opts);

        AuthorityRunCommittedChatOpsHook sut = new(
            delivery.Object,
            optionsMonitor.Object,
            Mock.Of<ILogger<AuthorityRunCommittedChatOpsHook>>());

        AuthorityRunCommittedChatOpsNotice notice = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            FindingCount = 1,
            Description = null,
        };

        await sut.NotifyAsync(notice, CancellationToken.None);

        delivery.Verify(
            d => d.DeliverAsync(
                ChatOpsWebhookTarget.Slack,
                It.IsAny<string>(),
                It.Is<ChatOpsWebhookMessage>(m =>
                    m.Title == "Authority run completed (1 finding)" && m.Body == "Run finished successfully."),
                It.IsAny<CancellationToken>(),
                It.IsAny<WebhookPostOptions?>()),
            Times.Once);

        delivery.Verify(
            d => d.DeliverAsync(
                ChatOpsWebhookTarget.Teams,
                It.IsAny<string>(),
                It.IsAny<ChatOpsWebhookMessage>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<WebhookPostOptions?>()),
            Times.Never);
    }

    [Fact]
    public async Task NotifyAsync_skips_when_webhook_url_is_whitespace_only()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();

        ChatOpsIncomingWebhooksOptions opts = new()
        {
            SlackNotifyOnAuthorityRunCompleted = true,
            SlackIncomingWebhookAbsoluteUri = "   ",
        };

        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(opts);

        AuthorityRunCommittedChatOpsHook sut = new(
            delivery.Object,
            optionsMonitor.Object,
            Mock.Of<ILogger<AuthorityRunCommittedChatOpsHook>>());

        AuthorityRunCommittedChatOpsNotice notice = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            FindingCount = 0,
        };

        await sut.NotifyAsync(notice, CancellationToken.None);

        delivery.Verify(
            d => d.DeliverAsync(
                It.IsAny<ChatOpsWebhookTarget>(),
                It.IsAny<string>(),
                It.IsAny<ChatOpsWebhookMessage>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<WebhookPostOptions?>()),
            Times.Never);
    }

    [Fact]
    public async Task NotifyAsync_skips_when_uri_is_not_absolute_https()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();

        ChatOpsIncomingWebhooksOptions opts = new()
        {
            SlackNotifyOnAuthorityRunCompleted = true,
            SlackIncomingWebhookAbsoluteUri = "ftp://hooks.example/hook",
        };

        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(opts);

        AuthorityRunCommittedChatOpsHook sut = new(
            delivery.Object,
            optionsMonitor.Object,
            Mock.Of<ILogger<AuthorityRunCommittedChatOpsHook>>());

        AuthorityRunCommittedChatOpsNotice notice = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            FindingCount = 0,
        };

        await sut.NotifyAsync(notice, CancellationToken.None);

        delivery.Verify(
            d => d.DeliverAsync(
                It.IsAny<ChatOpsWebhookTarget>(),
                It.IsAny<string>(),
                It.IsAny<ChatOpsWebhookMessage>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<WebhookPostOptions?>()),
            Times.Never);
    }

    [Fact]
    public void ctor_throws_when_incoming_webhooks_options_null()
    {
        Action act = () => new AuthorityRunCommittedChatOpsHook(
            Mock.Of<IChatOpsWebhookDeliveryService>(),
            null!,
            Mock.Of<ILogger<AuthorityRunCommittedChatOpsHook>>());

        act.Should().Throw<ArgumentNullException>().WithParameterName("incomingWebhooksOptions");
    }

    [Fact]
    public void ctor_throws_when_logger_null()
    {
        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> optionsMonitor = new();

        Action act = () => new AuthorityRunCommittedChatOpsHook(
            Mock.Of<IChatOpsWebhookDeliveryService>(),
            optionsMonitor.Object,
            null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("logger");
    }

    [Fact]
    public async Task NotifyAsync_skips_delivery_when_disabled_or_uri_invalid()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();

        ChatOpsIncomingWebhooksOptions opts = new()
        {
            SlackNotifyOnAuthorityRunCompleted = false,
            TeamsNotifyOnAuthorityRunCompleted = true,
            TeamsIncomingWebhookAbsoluteUri = "http://insecure.example/hook",
        };

        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(opts);

        AuthorityRunCommittedChatOpsHook sut = new(
            delivery.Object,
            optionsMonitor.Object,
            Mock.Of<ILogger<AuthorityRunCommittedChatOpsHook>>());

        AuthorityRunCommittedChatOpsNotice notice = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            FindingCount = 0,
            Description = " ",
        };

        await sut.NotifyAsync(notice, CancellationToken.None);

        delivery.Verify(
            d => d.DeliverAsync(
                It.IsAny<ChatOpsWebhookTarget>(),
                It.IsAny<string>(),
                It.IsAny<ChatOpsWebhookMessage>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<WebhookPostOptions?>()),
            Times.Never);
    }

    [Fact]
    public async Task NotifyAsync_suppresses_non_cancellation_errors_from_delivery()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        delivery.Setup(d =>
                d.DeliverAsync(
                    ChatOpsWebhookTarget.Slack,
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .ThrowsAsync(new InvalidOperationException("network"));

        delivery.Setup(d =>
                d.DeliverAsync(
                    ChatOpsWebhookTarget.Teams,
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Returns(Task.CompletedTask);

        ChatOpsIncomingWebhooksOptions opts = new()
        {
            SlackNotifyOnAuthorityRunCompleted = true,
            SlackIncomingWebhookAbsoluteUri = "https://hooks.slack.com/services/X/Y/Z",
            TeamsNotifyOnAuthorityRunCompleted = true,
            TeamsIncomingWebhookAbsoluteUri = "https://outlook.office.com/webhook/abc",
        };

        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(opts);

        AuthorityRunCommittedChatOpsHook sut = new(
            delivery.Object,
            optionsMonitor.Object,
            Mock.Of<ILogger<AuthorityRunCommittedChatOpsHook>>());

        AuthorityRunCommittedChatOpsNotice notice = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            FindingCount = 1,
        };

        Func<Task> act = async () => await sut.NotifyAsync(notice, CancellationToken.None);

        await act.Should().NotThrowAsync();

        delivery.Verify(
            d => d.DeliverAsync(
                ChatOpsWebhookTarget.Teams,
                It.IsAny<string>(),
                It.IsAny<ChatOpsWebhookMessage>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<WebhookPostOptions?>()),
            Times.Once);
    }

    [Fact]
    public async Task NotifyAsync_propagates_operation_canceled_from_delivery()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        delivery.Setup(d =>
                d.DeliverAsync(
                    It.IsAny<ChatOpsWebhookTarget>(),
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .ThrowsAsync(new OperationCanceledException());

        ChatOpsIncomingWebhooksOptions opts = new()
        {
            SlackNotifyOnAuthorityRunCompleted = true,
            SlackIncomingWebhookAbsoluteUri = "https://hooks.slack.com/services/X/Y/Z",
        };

        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(opts);

        AuthorityRunCommittedChatOpsHook sut = new(
            delivery.Object,
            optionsMonitor.Object,
            Mock.Of<ILogger<AuthorityRunCommittedChatOpsHook>>());

        AuthorityRunCommittedChatOpsNotice notice = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            FindingCount = 1,
        };

        Func<Task> act = async () => await sut.NotifyAsync(notice, CancellationToken.None);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public void ctor_throws_when_dependency_is_null()
    {
        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> optionsMonitor = new();

        Action act = () => new AuthorityRunCommittedChatOpsHook(
            null!,
            optionsMonitor.Object,
            Mock.Of<ILogger<AuthorityRunCommittedChatOpsHook>>());

        act.Should().Throw<ArgumentNullException>().WithParameterName("chatOpsWebhookDeliveryService");
    }

    [Fact]
    public async Task NotifyAsync_throws_when_notice_is_null()
    {
        AuthorityRunCommittedChatOpsHook sut = new(
            Mock.Of<IChatOpsWebhookDeliveryService>(),
            Mock.Of<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>>(),
            Mock.Of<ILogger<AuthorityRunCommittedChatOpsHook>>());

        Func<Task> act = async () => await sut.NotifyAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("notice");
    }
}
