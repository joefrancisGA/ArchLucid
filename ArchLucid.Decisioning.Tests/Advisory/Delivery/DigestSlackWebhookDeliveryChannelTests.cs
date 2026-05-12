using System.Reflection;

using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Notifications;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests.Advisory.Delivery;

[Trait("Category", "Unit")]
public sealed class DigestSlackWebhookDeliveryChannelTests
{
    [Fact]
    public void ChannelType_ReturnsSlackWebhook()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        DigestSlackWebhookDeliveryChannel sut = new(delivery.Object);

        sut.ChannelType.Should().Be(DigestDeliveryChannelType.SlackWebhook);
    }

    [Fact]
    public async Task SendAsync_PostsJsonToSubscriptionDestination()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        const string expectedUrl = "https://hooks.slack.com/services/digest";

        delivery.Setup(x =>
                x.DeliverAsync(
                    ChatOpsWebhookTarget.Slack,
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Returns(Task.CompletedTask);

        DigestSlackWebhookDeliveryChannel sut = new(delivery.Object);

        await sut.SendAsync(CreatePayload(expectedUrl), CancellationToken.None);

        delivery.Verify(
            x => x.DeliverAsync(
                ChatOpsWebhookTarget.Slack,
                expectedUrl,
                It.IsAny<ChatOpsWebhookMessage>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<WebhookPostOptions?>()),
            Times.Once);
    }

    [Fact]
    public async Task SendAsync_BodyText_IncludesTitleSummaryAndMarkdown()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        ChatOpsWebhookMessage? captured = null;

        delivery.Setup(x =>
                x.DeliverAsync(
                    ChatOpsWebhookTarget.Slack,
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Callback<ChatOpsWebhookTarget, string, ChatOpsWebhookMessage, CancellationToken, WebhookPostOptions?>(
                (_, _, msg, _, _) =>
                    captured = msg)
            .Returns(Task.CompletedTask);

        DigestSlackWebhookDeliveryChannel sut = new(delivery.Object);
        DigestDeliveryPayload payload = CreatePayload("https://hooks.slack.com/x");
        payload.Digest.Title = "Weekly digest";
        payload.Digest.Summary = "Three findings.";
        payload.Digest.ContentMarkdown = "## Details\n- item";

        await sut.SendAsync(payload, CancellationToken.None);

        captured.Should().NotBeNull();
        object body = ChatOpsIncomingWebhookBodies.ForSlack(captured!);
        string text = GetStringProperty(body, "text");

        text.Should().StartWith("*Weekly digest*\nThree findings.\n\n## Details\n- item");
    }

    [Fact]
    public async Task SendAsync_WhenPayloadIsNull_ThrowsArgumentNullException()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        DigestSlackWebhookDeliveryChannel sut = new(delivery.Object);

        Func<Task> act = async () => await sut.SendAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task SendAsync_ForwardsCancellationToken()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        CancellationToken expected = new(canceled: true);

        delivery.Setup(x =>
                x.DeliverAsync(
                    It.IsAny<ChatOpsWebhookTarget>(),
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Returns(Task.CompletedTask);

        DigestSlackWebhookDeliveryChannel sut = new(delivery.Object);

        await sut.SendAsync(CreatePayload("https://hooks.slack.com/x"), expected);

        delivery.Verify(
            x => x.DeliverAsync(
                It.IsAny<ChatOpsWebhookTarget>(),
                It.IsAny<string>(),
                It.IsAny<ChatOpsWebhookMessage>(),
                expected,
                It.IsAny<WebhookPostOptions?>()),
            Times.Once);
    }

    private static DigestDeliveryPayload CreatePayload(string destination)
    {
        return new DigestDeliveryPayload
        {
            Digest = new ArchitectureDigest
            {
                DigestId = Guid.NewGuid(),
                Title = "T",
                Summary = "S",
                ContentMarkdown = "M",
            },
            Subscription = new DigestSubscription
            {
                Destination = destination,
                ChannelType = DigestDeliveryChannelType.SlackWebhook,
            },
        };
    }

    private static string GetStringProperty(object target, string propertyName)
    {
        PropertyInfo? prop = target.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);

        prop.Should().NotBeNull($"property {propertyName} should exist on payload body");
        object? value = prop.GetValue(target);

        value.Should().NotBeNull();

        return value.ToString()!;
    }
}
