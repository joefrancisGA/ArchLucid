using System.Reflection;

using ArchLucid.Notifications.Advisory;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Notifications;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests.Advisory.Delivery;

[Trait("Category", "Unit")]
public sealed class DigestTeamsWebhookDeliveryChannelTests
{
    [Fact]
    public void ChannelType_ReturnsTeamsWebhook()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        DigestTeamsWebhookDeliveryChannel sut = new(delivery.Object);

        sut.ChannelType.Should().Be(DigestDeliveryChannelType.TeamsWebhook);
    }

    [Fact]
    public async Task SendAsync_PostsJsonToSubscriptionDestination()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        const string expectedUrl = "https://outlook.office.com/webhook/digest";

        delivery.Setup(x =>
                x.DeliverAsync(
                    ChatOpsWebhookTarget.Teams,
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Returns(Task.CompletedTask);

        DigestTeamsWebhookDeliveryChannel sut = new(delivery.Object);

        await sut.SendAsync(CreatePayload(expectedUrl), CancellationToken.None);

        delivery.Verify(
            x => x.DeliverAsync(
                ChatOpsWebhookTarget.Teams,
                expectedUrl,
                It.IsAny<ChatOpsWebhookMessage>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<WebhookPostOptions?>()),
            Times.Once);
    }

    [Fact]
    public async Task SendAsync_Body_HasTitleAndTextWithSummaryAndMarkdown()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        ChatOpsWebhookMessage? captured = null;

        delivery.Setup(x =>
                x.DeliverAsync(
                    ChatOpsWebhookTarget.Teams,
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Callback<ChatOpsWebhookTarget, string, ChatOpsWebhookMessage, CancellationToken, WebhookPostOptions?>(
                (_, _, msg, _, _) =>
                    captured = msg)
            .Returns(Task.CompletedTask);

        DigestTeamsWebhookDeliveryChannel sut = new(delivery.Object);
        DigestDeliveryPayload payload = CreatePayload("https://outlook.office.com/webhook/x");
        payload.Digest.Title = "Sprint digest";
        payload.Digest.Summary = "Coverage improved.";
        payload.Digest.ContentMarkdown = "### Changes\n- a";

        await sut.SendAsync(payload, CancellationToken.None);

        captured.Should().NotBeNull();
        object body = ChatOpsIncomingWebhookBodies.ForTeams(captured!);
        string title = GetStringProperty(body, "title");
        string text = GetStringProperty(body, "text");

        title.Should().Be("Sprint digest");
        text.Should().Be("Coverage improved.\n\n### Changes\n- a");
    }

    [Fact]
    public async Task SendAsync_WhenPayloadIsNull_ThrowsArgumentNullException()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        DigestTeamsWebhookDeliveryChannel sut = new(delivery.Object);

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

        DigestTeamsWebhookDeliveryChannel sut = new(delivery.Object);

        await sut.SendAsync(CreatePayload("https://outlook.office.com/webhook/x"), expected);

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
                ChannelType = DigestDeliveryChannelType.TeamsWebhook,
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
