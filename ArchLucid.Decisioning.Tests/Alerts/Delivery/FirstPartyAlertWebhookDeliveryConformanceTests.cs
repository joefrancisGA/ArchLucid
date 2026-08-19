using System.Reflection;

using ArchLucid.Decisioning.Alerts;
using ArchLucid.Notifications.Alerts;
using ArchLucid.Notifications;

using ArchLucid.TestSupport.Connectors;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests.Alerts.Delivery;

[Trait("Category", "Unit")]
public sealed class FirstPartyAlertWebhookDeliveryConformanceTests
{
    [Fact]
    public async Task AlertSlackWebhook_conformance_post_json_body_does_not_echo_destination()
    {
        const string connectorName = "Alert Slack incoming webhook";

        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        ChatOpsWebhookMessage? captured = null;

        delivery.Setup(x =>
                x.DeliverAsync(
                    It.IsAny<ChatOpsWebhookTarget>(),
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Callback<ChatOpsWebhookTarget, string, ChatOpsWebhookMessage, CancellationToken, WebhookPostOptions?>(
                (_, _, msg, _, _) =>
                    captured = msg)
            .Returns(Task.CompletedTask);

        const string destination = "https://hooks.slack.com/services/TEST/FAKE/URLTOKEN";

        AlertSlackWebhookDeliveryChannel sut = new(delivery.Object);
        await sut.SendAsync(CreateAlertPayload(destination, AlertRoutingChannelType.SlackWebhook), CancellationToken.None);

        captured.Should().NotBeNull();
        object body = ChatOpsIncomingWebhookBodies.ForSlack(captured!);
        WebhookPostJsonBodyOutboundConnectorConformance.AssertBodyJsonDoesNotEchoDestination(connectorName, body, destination);
    }

    [Fact]
    public async Task AlertTeamsWebhook_conformance_post_json_body_does_not_echo_destination()
    {
        const string connectorName = "Alert Microsoft Teams incoming webhook";

        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        ChatOpsWebhookMessage? captured = null;

        delivery.Setup(x =>
                x.DeliverAsync(
                    It.IsAny<ChatOpsWebhookTarget>(),
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Callback<ChatOpsWebhookTarget, string, ChatOpsWebhookMessage, CancellationToken, WebhookPostOptions?>(
                (_, _, msg, _, _) =>
                    captured = msg)
            .Returns(Task.CompletedTask);

        const string destination = "https://outlook.office.com/webhook/00000000-0000-0000-0000-000000000000@00000000-0000-0000-0000-000000000000/IncomingWebhook/fake";

        AlertTeamsWebhookDeliveryChannel sut = new(delivery.Object);
        await sut.SendAsync(CreateAlertPayload(destination, AlertRoutingChannelType.TeamsWebhook), CancellationToken.None);

        captured.Should().NotBeNull();
        object body = ChatOpsIncomingWebhookBodies.ForTeams(captured!);

        WebhookPostJsonBodyOutboundConnectorConformance.AssertBodyJsonDoesNotEchoDestination(connectorName, body, destination);
    }

    [Fact]
    public async Task AlertOnCallWebhook_conformance_post_json_body_does_not_echo_destination_and_includes_run_correlation()
    {
        const string connectorName = "Alert on-call webhook";

        Mock<IWebhookPoster> poster = new();
        object? body = null;

        poster
            .Setup(x =>
                x.PostJsonAsync(
                    It.IsAny<string>(),
                    It.IsAny<object>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Callback<string, object, CancellationToken, WebhookPostOptions?>((_, b, _, _) =>
                body = b)
            .Returns(Task.CompletedTask);

        const string destination = "https://pager.example.com/inbound/fake-token-path";
        Guid runId = Guid.Parse("11111111-2222-3333-4444-555555555555");

        AlertOnCallWebhookDeliveryChannel sut = new(poster.Object);
        AlertDeliveryPayload payload = CreateAlertPayload(destination, AlertRoutingChannelType.OnCallWebhook);
        payload.Alert.RunId = runId;

        await sut.SendAsync(payload, CancellationToken.None);

        body.Should().NotBeNull();
        WebhookPostJsonBodyOutboundConnectorConformance.AssertBodyJsonDoesNotEchoDestination(connectorName, body!, destination);

        object runProp = GetPropertyValue(body!, "runId")!;

        runProp.Should().Be(runId, because: $"{connectorName}: run id must propagate for paging correlation.");
    }

    private static AlertDeliveryPayload CreateAlertPayload(string destination, string channelType)
    {
        return new AlertDeliveryPayload
        {
            Alert = new AlertRecord
            {
                AlertId = Guid.NewGuid(),
                Title = "T",
                Category = "C",
                Severity = "Warning",
                TriggerValue = "1",
                Description = "D",
            },
            Subscription = new AlertRoutingSubscription
            {
                Destination = destination,
                ChannelType = channelType,
            },
        };
    }

    private static object? GetPropertyValue(object target, string propertyName)
    {
        PropertyInfo? prop = target.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);

        prop.Should().NotBeNull($"property {propertyName} should exist on payload body");

        return prop.GetValue(target);
    }
}
