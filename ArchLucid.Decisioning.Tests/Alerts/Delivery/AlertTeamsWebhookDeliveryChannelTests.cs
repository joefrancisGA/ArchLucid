using System.Reflection;

using ArchLucid.Decisioning.Alerts;
using ArchLucid.Notifications.Alerts;
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
        text.Should().Contain("Trigger: p99 &gt; 2s");
        text.Should().Contain("Check downstream service.");
    }

    [Fact]
    public async Task SendAsync_TeamsPayload_HtmlEncodes_evaluation_sourced_alert_copy()
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
        payload.Alert.Title = "<b>Spoofed title</b>";
        payload.Alert.Category = "Cost<script>";
        payload.Alert.TriggerValue = "spend > 1";
        payload.Alert.Description = "<i>Injected</i> description.";

        await sut.SendAsync(payload, CancellationToken.None);

        captured.Should().NotBeNull();
        object body = ChatOpsIncomingWebhookBodies.ForTeams(captured!);
        string title = GetStringProperty(body, "title");
        string text = GetStringProperty(body, "text");

        title.Should().Be("[High] &lt;b&gt;Spoofed title&lt;/b&gt;");
        text.Should().Contain("Category: Cost&lt;script&gt;");
        text.Should().Contain("&lt;i&gt;Injected&lt;/i&gt; description.");
    }

    [Fact]
    public async Task SendAsync_TeamsPayload_HtmlEncodes_severity_in_title_prefix()
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
        payload.Alert.Severity = "High<script>alert(1)</script>";
        payload.Alert.Title = "Latency spike";
        payload.Alert.Description = "Check service.";

        await sut.SendAsync(payload, CancellationToken.None);

        captured.Should().NotBeNull();
        object body = ChatOpsIncomingWebhookBodies.ForTeams(captured!);
        string title = GetStringProperty(body, "title");

        title.Should().Be("[High&lt;script&gt;alert(1)&lt;/script&gt;] Latency spike");
    }

    [Fact]
    public async Task SendAsync_throws_when_subscription_destination_has_embedded_line_breaks()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        AlertTeamsWebhookDeliveryChannel sut = new(delivery.Object);
        AlertDeliveryPayload payload = CreatePayload("https://outlook.office.com/webhook/test");
        payload.Subscription.Destination =
            "https://outlook.office.com/webhook/test\r\nHost: injected.evil.test";

        Func<Task> act = async () => await sut.SendAsync(payload, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
        delivery.Verify(
            x => x.DeliverAsync(
                It.IsAny<ChatOpsWebhookTarget>(),
                It.IsAny<string>(),
                It.IsAny<ChatOpsWebhookMessage>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<WebhookPostOptions?>()),
            Times.Never);
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
