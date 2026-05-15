using ArchLucid.Notifications;

using FluentAssertions;

namespace ArchLucid.Notifications.Tests;

[Trait("Category", "Unit")]
public sealed class ChatOpsWebhookMessageTests
{
    [Fact]
    public void init_allows_optional_severity_and_supporting()
    {
        ChatOpsWebhookMessage sut = new()
        {
            SeverityLabel = "Low",
            Title = "Hello",
            SupportingParagraph = "Extra",
            Body = "Main",
        };

        sut.SeverityLabel.Should().Be("Low");
        sut.Title.Should().Be("Hello");
        sut.SupportingParagraph.Should().Be("Extra");
        sut.Body.Should().Be("Main");
    }
}
