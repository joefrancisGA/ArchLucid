using System.Collections;
using System.Reflection;

using ArchLucid.Notifications;

using FluentAssertions;

namespace ArchLucid.Notifications.Tests;

[Trait("Category", "Unit")]
public sealed class ChatOpsIncomingWebhookBodiesTests
{
    [Fact]
    public void ForSlack_includes_severity_bracket_when_label_present()
    {
        ChatOpsWebhookMessage message = new()
        {
            SeverityLabel = " High ",
            Title = "Headline",
            SupportingParagraph = "Mid",
            Body = " Tail ",
        };

        object payload = ChatOpsIncomingWebhookBodies.ForSlack(message);

        string text = NotificationsTestPayloadAssert.GetStringProperty(payload, "text");

        text.Should().Contain("*[High]* Headline");
        text.Should().Contain("Mid");
        text.Should().Contain("Tail");
    }

    [Fact]
    public void ForSlack_omits_severity_when_label_empty_uses_title_only()
    {
        ChatOpsWebhookMessage message = new()
        {
            SeverityLabel = "  ",
            Title = "T",
            SupportingParagraph = null,
            Body = "B",
        };

        object payload = ChatOpsIncomingWebhookBodies.ForSlack(message);

        string text = NotificationsTestPayloadAssert.GetStringProperty(payload, "text");

        text.Should().StartWith("*T*");
        text.Should().Contain("B");
    }

    [Fact]
    public void ForTeams_supports_optional_supporting_paragraph()
    {
        ChatOpsWebhookMessage withSupport = new()
        {
            SeverityLabel = null,
            Title = "Runs",
            SupportingParagraph = "  summary  ",
            Body = "details",
        };

        object withPayload = ChatOpsIncomingWebhookBodies.ForTeams(withSupport);

        NotificationsTestPayloadAssert.GetStringProperty(withPayload, "title").Should().Be("Runs");

        NotificationsTestPayloadAssert.GetStringProperty(withPayload, "text").Should().Be("summary\n\ndetails");

        ChatOpsWebhookMessage noSupport = new()
        {
            Title = "T",
            SupportingParagraph = null,
            Body = " only ",
        };

        object noPayload = ChatOpsIncomingWebhookBodies.ForTeams(noSupport);

        NotificationsTestPayloadAssert.GetStringProperty(noPayload, "text").Should().Be("only");
    }

    [Fact]
    public void ForSlackWithGovernanceActions_builds_block_kit_with_action_values()
    {
        ChatOpsWebhookMessage message = new()
        {
            SeverityLabel = "Crit",
            Title = "Approve?",
            SupportingParagraph = null,
            Body = "Details",
        };

        const string approvalId = "req-001";
        object payload = ChatOpsIncomingWebhookBodies.ForSlackWithGovernanceActions(message, approvalId);

        PropertyInfo? blocksProp = payload.GetType().GetProperty("blocks", BindingFlags.Public | BindingFlags.Instance);

        blocksProp.Should().NotBeNull();

        object? blocksObj = blocksProp!.GetValue(payload);

        blocksObj.Should().BeAssignableTo<IEnumerable>();

        object[] blocks = ((IEnumerable)blocksObj!).Cast<object>().ToArray();

        blocks.Should().HaveCount(2);

        string actionsJson = System.Text.Json.JsonSerializer.Serialize(blocks[1]);

        actionsJson.Should().Contain("governance_approve:req-001");
        actionsJson.Should().Contain("governance_reject:req-001");
    }

    [Fact]
    public void ForSlack_throws_when_message_null()
    {
        Action act = () => ChatOpsIncomingWebhookBodies.ForSlack(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("message");
    }

    [Fact]
    public void ForSlackWithGovernanceActions_throws_when_approval_id_invalid()
    {
        ChatOpsWebhookMessage message = new() { Title = "t", Body = "b" };

        Action act = () => ChatOpsIncomingWebhookBodies.ForSlackWithGovernanceActions(message, " ");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ForTeams_throws_when_message_null()
    {
        Action act = () => ChatOpsIncomingWebhookBodies.ForTeams(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("message");
    }
}
