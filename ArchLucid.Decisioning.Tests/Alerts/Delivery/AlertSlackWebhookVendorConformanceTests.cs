using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Delivery;
using ArchLucid.Notifications;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests.Alerts.Delivery;

/// <summary>
///     Fake-provider style conformance for Slack alert webhooks (no hooks.slack.com calls — poster is mocked).
/// </summary>
[Trait("Category", "Unit")]
public sealed class AlertSlackWebhookVendorConformanceTests
{
    [Fact]
    public async Task SendAsync_conformance_posts_to_destination_with_authority_shaped_text()
    {
        const string destination = "https://hooks.slack.com/services/FAKE/ONLY/UNITTEST";

        string? postedUrl = null;
        object? body = null;

        Mock<IWebhookPoster> poster = new();
        poster
            .Setup(p => p.PostJsonAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>(), It.IsAny<WebhookPostOptions?>()))
            .Callback<string, object, CancellationToken, WebhookPostOptions?>((url, b, _, _) =>
            {
                postedUrl = url;
                body = b;
            })
            .Returns(Task.CompletedTask);

        AlertSlackWebhookDeliveryChannel sut = new(poster.Object);

        AlertDeliveryPayload payload = CreatePayload(
            destination,
            title: "Latency regression",
            severity: "Warning",
            category: "SLO",
            trigger: "p95 > 800ms",
            description: "Checkout path breached budget during rollout.");

        await sut.SendAsync(payload, CancellationToken.None);

        postedUrl.Should().Be(destination, because: "Slack incoming webhooks require POSTing to the customer-provided URL.");
        body.Should().NotBeNull();
        string text = GetStringProperty(body!, "text");
        text.Should().Contain("[Warning]", because: "Severity must be visible for on-call triage.");
        text.Should().Contain("Latency regression");
        text.Should().Contain("SLO");
        text.Should().Contain("p95 > 800ms");
        text.Should().Contain("Checkout path breached");
    }

    [Fact]
    public async Task SendAsync_when_poster_fails_propagates_exception()
    {
        Mock<IWebhookPoster> poster = new();
        poster
            .Setup(p => p.PostJsonAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>(), It.IsAny<WebhookPostOptions?>()))
            .ThrowsAsync(new HttpRequestException("simulated transport failure"));

        AlertSlackWebhookDeliveryChannel sut = new(poster.Object);
        AlertDeliveryPayload payload = CreatePayload(
            "https://hooks.slack.com/services/FAKE/ONLY/UNITTEST",
            title: "T",
            severity: "Error",
            category: "C",
            trigger: "1",
            description: "D");

        Func<Task> act = async () => await sut.SendAsync(payload, CancellationToken.None);

        await act.Should().ThrowAsync<HttpRequestException>();
    }

    private static AlertDeliveryPayload CreatePayload(
        string destination,
        string title,
        string severity,
        string category,
        string trigger,
        string description)
    {
        return new AlertDeliveryPayload
        {
            Alert = new AlertRecord
            {
                AlertId = Guid.NewGuid(),
                Title = title,
                Category = category,
                Severity = severity,
                TriggerValue = trigger,
                Description = description,
            },
            Subscription = new AlertRoutingSubscription
            {
                Destination = destination,
                ChannelType = AlertRoutingChannelType.SlackWebhook,
            },
        };
    }

    private static string GetStringProperty(object target, string name)
    {
        System.Reflection.PropertyInfo? prop =
            target.GetType().GetProperty(name, System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);

        prop.Should().NotBeNull($"expected `{name}` on Slack webhook body projection");

        return prop!.GetValue(target) as string ?? string.Empty;
    }
}
