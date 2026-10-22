using System.Reflection;

using ArchLucid.Notifications;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests.ChatOps;

[Trait("Category", "Unit")]
public sealed class ChatOpsWebhookDeliveryServiceTests
{
    [Fact]
    public async Task DeliverAsync_slack_forwards_absolute_uri_and_json_text_field()
    {
        Mock<IWebhookPoster> poster = new();
        string? capturedUrl = null;
        object? capturedBody = null;

        poster.Setup(p =>
                p.PostJsonAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>(), It.IsAny<WebhookPostOptions?>()))
            .Callback<string, object, CancellationToken, WebhookPostOptions?>((u, b, _, _) =>
            {
                capturedUrl = u;
                capturedBody = b;
            })
            .Returns(Task.CompletedTask);

        ChatOpsWebhookDeliveryService sut = new(poster.Object);
        ChatOpsWebhookMessage msg = new()
        {
            Title = "Hello",
            Body = "World",
            SupportingParagraph = null,
            SeverityLabel = null,
        };

        WebhookPostOptions opts = new() { TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee") };

        const string slackUrl = "https://hooks.slack.com/services/FAKE/WIRING/TESTS";

        await sut.DeliverAsync(ChatOpsWebhookTarget.Slack, slackUrl, msg, CancellationToken.None, opts);

        capturedUrl.Should().Be(slackUrl);

        string text = GetStringProperty(capturedBody!, "text");

        text.Should().Contain("*Hello*");
        text.Should().Contain("World");

        poster.Verify(
            p => p.PostJsonAsync(slackUrl, It.IsAny<object>(), It.IsAny<CancellationToken>(), It.IsAny<WebhookPostOptions?>()),
            Times.Once);
    }

    [Fact]
    public async Task DeliverAsync_teams_posts_title_and_text_fields()
    {
        Mock<IWebhookPoster> poster = new();
        object? capturedBody = null;

        poster.Setup(p =>
                p.PostJsonAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>(), It.IsAny<WebhookPostOptions?>()))
            .Callback<string, object, CancellationToken, WebhookPostOptions?>((_, b, _, _) =>
                capturedBody = b)
            .Returns(Task.CompletedTask);

        ChatOpsWebhookDeliveryService sut = new(poster.Object);
        ChatOpsWebhookMessage msg = new()
        {
            SeverityLabel = "Info",
            Title = "Runs",
            SupportingParagraph = "Line a",
            Body = "Line b",
        };

        await sut.DeliverAsync(
            ChatOpsWebhookTarget.Teams,
            "https://outlook.office.com/webhook/fake-incoming-hook",
            msg,
            CancellationToken.None);

        GetStringProperty(capturedBody!, "title").Should().Be("[Info] Runs");

        GetStringProperty(capturedBody!, "text").Should().Contain("Line a");

        GetStringProperty(capturedBody!, "text").Should().Contain("Line b");
    }

    private static string GetStringProperty(object target, string propertyName)
    {
        PropertyInfo? prop = target.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);

        prop.Should().NotBeNull();
        object? value = prop.GetValue(target);

        value.Should().NotBeNull();

        return value.ToString()!;
    }
}
