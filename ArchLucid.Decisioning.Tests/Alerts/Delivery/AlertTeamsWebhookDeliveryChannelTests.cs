using System.Reflection;

using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Delivery;
using ArchLucid.Notifications;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests.Alerts.Delivery;

[Trait("Category", "Unit")]
public sealed class AlertTeamsWebhookDeliveryChannelTests
{
    [Fact]
    public void ChannelType_ReturnsTeamsWebhook()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        AlertTeamsWebhookDeliveryChannel sut = new(delivery.Object);

        sut.ChannelType.Should().Be(AlertRoutingChannelType.TeamsWebhook);
    }

    [Fact]
    public async Task SendAsync_PostsJsonToSubscriptionDestination()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        const string expectedUrl = "https://outlook.office.com/webhook/test";

        delivery.Setup(x =>
                x.DeliverAsync(
                    ChatOpsWebhookTarget.Teams,
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Returns(Task.CompletedTask);

        AlertTeamsWebhookDeliveryChannel sut = new(delivery.Object);

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
    public async Task SendAsync_Body_HasTitleAndTextWithExpectedContent()
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

        AlertTeamsWebhookDeliveryChannel sut = new(delivery.Object);
        AlertDeliveryPayload payload = CreatePayload("https://outlook.office.com/webhook/x");
        payload.Alert.Severity = "High";
        payload.Alert.Title = "Latency spike";
        payload.Alert.Category = "Performance";
        payload.Alert.TriggerValue = "p99 > 2s";
        payload.Alert.Description = "Check downstream service.";

        await sut.SendAsync(payload, CancellationToken.None);

        captured.Should().NotBeNull();
        object body = ChatOpsIncomingWebhookBodies.ForTeams(captured!);
        string title = GetStringProperty(body, "title");
        string text = GetStringProperty(body, "text");

        title.Should().Be("[High] Latency spike");
        text.Should().Contain("Category: Performance");
        text.Should().Contain("Trigger: p99 > 2s");
        text.Should().Contain("Check downstream service.");
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

        AlertTeamsWebhookDeliveryChannel sut = new(delivery.Object);

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

    private static AlertDeliveryPayload CreatePayload(string destination)
    {
        return new AlertDeliveryPayload
        {
            Alert = new AlertRecord
            {
                AlertId = Guid.NewGuid(),
                Title = "T",
                Category = "C",
                Severity = "Info",
                TriggerValue = "1",
                Description = "D",
            },
            Subscription = new AlertRoutingSubscription
            {
                Destination = destination,
                ChannelType = AlertRoutingChannelType.TeamsWebhook,
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
