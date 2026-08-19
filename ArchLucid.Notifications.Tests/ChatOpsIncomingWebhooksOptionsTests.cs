using FluentAssertions;

namespace ArchLucid.Notifications.Tests;

[Trait("Category", "Unit")]
public sealed class ChatOpsIncomingWebhooksOptionsTests
{
    [Fact]
    public void SectionName_matches_configuration_key()
    {
        ChatOpsIncomingWebhooksOptions.SectionName.Should().Be("ChatOpsIncomingWebhooks");
    }

    [Fact]
    public void Properties_round_trip()
    {
        ChatOpsIncomingWebhooksOptions sut = new()
        {
            SlackNotifyOnAuthorityRunCompleted = true,
            SlackIncomingWebhookAbsoluteUri = "https://slack",
            TeamsNotifyOnAuthorityRunCompleted = false,
            TeamsIncomingWebhookAbsoluteUri = "https://teams",
            SlackSigningSecret = "secret",
        };

        sut.SlackNotifyOnAuthorityRunCompleted.Should().BeTrue();
        sut.SlackIncomingWebhookAbsoluteUri.Should().Be("https://slack");
        sut.TeamsNotifyOnAuthorityRunCompleted.Should().BeFalse();
        sut.TeamsIncomingWebhookAbsoluteUri.Should().Be("https://teams");
        sut.SlackSigningSecret.Should().Be("secret");
    }
}
