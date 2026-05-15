using ArchLucid.Notifications;

using FluentAssertions;

using Moq;

namespace ArchLucid.Notifications.Tests;

[Trait("Category", "Unit")]
public sealed class ChatOpsWebhookDeliveryServiceTests
{
    [Fact]
    public void ctor_throws_when_poster_null()
    {
        Action act = () => new ChatOpsWebhookDeliveryService(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("webhookPoster");
    }

    [Fact]
    public async Task DeliverAsync_slack_invokes_poster()
    {
        Mock<IWebhookPoster> poster = new();
        poster.Setup(p =>
                p.PostJsonAsync(
                    It.IsAny<string>(),
                    It.IsAny<object>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Returns(Task.CompletedTask);

        ChatOpsWebhookDeliveryService sut = new(poster.Object);
        ChatOpsWebhookMessage msg = new() { Title = "Hi", Body = "There" };

        await sut.DeliverAsync(
            ChatOpsWebhookTarget.Slack,
            "https://hooks.slack.com/services/TEST",
            msg,
            CancellationToken.None,
            new WebhookPostOptions { EventType = "test.event" });

        poster.Verify(
            p => p.PostJsonAsync(
                "https://hooks.slack.com/services/TEST",
                It.IsAny<object>(),
                It.IsAny<CancellationToken>(),
                It.Is<WebhookPostOptions?>(o => o != null && o.EventType == "test.event")),
            Times.Once);
    }

    [Fact]
    public async Task DeliverAsync_teams_invokes_poster()
    {
        Mock<IWebhookPoster> poster = new();
        poster.Setup(p =>
                p.PostJsonAsync(
                    It.IsAny<string>(),
                    It.IsAny<object>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Returns(Task.CompletedTask);

        ChatOpsWebhookDeliveryService sut = new(poster.Object);
        ChatOpsWebhookMessage msg = new() { Title = "T", Body = "Body" };

        await sut.DeliverAsync(
            ChatOpsWebhookTarget.Teams,
            "https://outlook.office.com/webhook/TEST",
            msg,
            CancellationToken.None);

        poster.Verify(
            p => p.PostJsonAsync(
                "https://outlook.office.com/webhook/TEST",
                It.IsAny<object>(),
                It.IsAny<CancellationToken>(),
                null),
            Times.Once);
    }

    [Fact]
    public async Task DeliverAsync_throws_when_uri_blank()
    {
        ChatOpsWebhookDeliveryService sut = new(Mock.Of<IWebhookPoster>());
        ChatOpsWebhookMessage msg = new() { Title = "t", Body = "b" };

        Func<Task> act = async () =>
            await sut.DeliverAsync(ChatOpsWebhookTarget.Slack, " ", msg, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task DeliverAsync_throws_when_message_null()
    {
        ChatOpsWebhookDeliveryService sut = new(Mock.Of<IWebhookPoster>());

        Func<Task> act = async () =>
            await sut.DeliverAsync(
                ChatOpsWebhookTarget.Slack,
                "https://hooks.slack.com/x",
                null!,
                CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("message");
    }

    [Fact]
    public async Task DeliverAsync_throws_when_target_not_slack_or_teams()
    {
        Mock<IWebhookPoster> poster = new();
        poster.Setup(p =>
                p.PostJsonAsync(
                    It.IsAny<string>(),
                    It.IsAny<object>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Returns(Task.CompletedTask);

        ChatOpsWebhookDeliveryService sut = new(poster.Object);
        ChatOpsWebhookMessage msg = new() { Title = "t", Body = "b" };

        const ChatOpsWebhookTarget invalid = (ChatOpsWebhookTarget)99;

        Func<Task> act = async () =>
            await sut.DeliverAsync(invalid, "https://example.com/hook", msg, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentOutOfRangeException>().WithParameterName("target");

        poster.Verify(
            p => p.PostJsonAsync(
                It.IsAny<string>(),
                It.IsAny<object>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<WebhookPostOptions?>()),
            Times.Never);
    }
}
