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
    public void ForSlackWithGovernanceActions_escapes_mrkdwn_metacharacters_in_body_section()
    {
        ChatOpsWebhookMessage message = new()
        {
            SeverityLabel = null,
            Title = "Governance approval",
            SupportingParagraph = null,
            Body = "Reviewer note: *urgent* action required",
        };

        object payload = ChatOpsIncomingWebhookBodies.ForSlackWithGovernanceActions(message, "req-approve-1");

        PropertyInfo? blocksProp = payload.GetType().GetProperty("blocks", BindingFlags.Public | BindingFlags.Instance);

        blocksProp.Should().NotBeNull();

        object? blocksObj = blocksProp!.GetValue(payload);

        object[] blocks = ((IEnumerable)blocksObj!).Cast<object>().ToArray();

        string sectionJson = System.Text.Json.JsonSerializer.Serialize(blocks[0]);

        using System.Text.Json.JsonDocument document = System.Text.Json.JsonDocument.Parse(sectionJson);

        string mrkdwnText = document.RootElement.GetProperty("text").GetProperty("text").GetString()!;

        mrkdwnText.Should().Contain("Reviewer note: \\*urgent\\* action required");
    }

    [Fact]
    public void ForSlack_preserves_backtick_code_span_in_supporting_paragraph()
    {
        ChatOpsWebhookMessage message = new()
        {
            Title = "Authority run completed (1 finding)",
            SupportingParagraph = "Run `11111111-2222-3333-4444-555555555555`",
            Body = "Done",
        };

        object payload = ChatOpsIncomingWebhookBodies.ForSlack(message);

        string text = NotificationsTestPayloadAssert.GetStringProperty(payload, "text");

        text.Should().Contain("Run `11111111-2222-3333-4444-555555555555`");
        text.Should().NotContain("Run \\`");
    }

    [Fact]
    public void ForSlack_escapes_asterisks_in_supporting_paragraph_between_headline_and_body()
    {
        ChatOpsWebhookMessage message = new()
        {
            SeverityLabel = null,
            Title = "Budget alert",
            SupportingParagraph = "Category: Cost\nTrigger: *spoofed* emphasis",
            Body = "Investigate spend.",
        };

        object payload = ChatOpsIncomingWebhookBodies.ForSlack(message);

        string text = NotificationsTestPayloadAssert.GetStringProperty(payload, "text");

        text.Should().Contain("Trigger: \\*spoofed\\* emphasis");
    }

    [Fact]
    public void ForSlack_escapes_asterisks_in_title_when_wrapping_headline_emphasis()
    {
        ChatOpsWebhookMessage message = new()
        {
            SeverityLabel = "Warning",
            Title = "See *spoofed* emphasis",
            SupportingParagraph = null,
            Body = "Details",
        };

        object payload = ChatOpsIncomingWebhookBodies.ForSlack(message);

        string text = NotificationsTestPayloadAssert.GetStringProperty(payload, "text");

        text.Should().Contain("*[Warning]* See \\*spoofed\\* emphasis");
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

    [Fact]
    public void ForTeams_omits_severity_prefix_when_label_is_bracket_only()
    {
        ChatOpsWebhookMessage message = new()
        {
            SeverityLabel = " ]][ ",
            Title = "Actual headline",
            Body = "details",
        };

        object payload = ChatOpsIncomingWebhookBodies.ForTeams(message);

        NotificationsTestPayloadAssert.GetStringProperty(payload, "title").Should().Be("Actual headline");
    }

    [Fact]
    public void ForSlack_omits_severity_emphasis_when_label_is_bracket_only()
    {
        ChatOpsWebhookMessage message = new()
        {
            SeverityLabel = "[[ ]]",
            Title = "Actual headline",
            Body = "details",
        };

        object payload = ChatOpsIncomingWebhookBodies.ForSlack(message);

        string text = NotificationsTestPayloadAssert.GetStringProperty(payload, "text");

        text.Should().StartWith("*Actual headline*");
    }

    [Fact]
    public void ForSlack_strips_brackets_from_severity_label_before_headline_emphasis()
    {
        ChatOpsWebhookMessage message = new()
        {
            SeverityLabel = "Low] [Critical",
            Title = "Actual headline",
            Body = "details",
        };

        object payload = ChatOpsIncomingWebhookBodies.ForSlack(message);

        string text = NotificationsTestPayloadAssert.GetStringProperty(payload, "text");

        text.Should().StartWith("*[Low Critical]* Actual headline");
    }

    [Fact]
    public void ForTeams_strips_brackets_from_severity_label_before_title_prefix()
    {
        ChatOpsWebhookMessage message = new()
        {
            SeverityLabel = "Low] [Critical",
            Title = "Actual headline",
            Body = "details",
        };

        object payload = ChatOpsIncomingWebhookBodies.ForTeams(message);

        NotificationsTestPayloadAssert.GetStringProperty(payload, "title")
            .Should().Be("[Low Critical] Actual headline");
    }

    [Fact]
    public void ForTeams_html_encodes_severity_label_before_title_prefix()
    {
        ChatOpsWebhookMessage message = new()
        {
            SeverityLabel = "High<script>alert(1)</script>",
            Title = "Latency spike",
            Body = "details",
        };

        object payload = ChatOpsIncomingWebhookBodies.ForTeams(message);

        NotificationsTestPayloadAssert.GetStringProperty(payload, "title")
            .Should().Be("[High&lt;script&gt;alert(1)&lt;/script&gt;] Latency spike");
    }

    [Fact]
    public void ForTeams_html_encodes_title_metacharacters_in_connector_title_field()
    {
        ChatOpsWebhookMessage withSeverity = new()
        {
            SeverityLabel = "High",
            Title = "<b>Spoofed</b> headline",
            Body = "details",
        };

        object withSeverityPayload = ChatOpsIncomingWebhookBodies.ForTeams(withSeverity);

        NotificationsTestPayloadAssert.GetStringProperty(withSeverityPayload, "title")
            .Should().Be("[High] &lt;b&gt;Spoofed&lt;/b&gt; headline");

        ChatOpsWebhookMessage withoutSeverity = new()
        {
            SeverityLabel = null,
            Title = "<img onerror=alert(1)>",
            Body = "details",
        };

        object withoutSeverityPayload = ChatOpsIncomingWebhookBodies.ForTeams(withoutSeverity);

        NotificationsTestPayloadAssert.GetStringProperty(withoutSeverityPayload, "title")
            .Should().Be("&lt;img onerror=alert(1)&gt;");
    }
}
