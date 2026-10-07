using ArchLucid.Application.Integrations.Itsm;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmInboundWebhookReplayEventIdTests
{
    [Fact]
    public void Resolve_prefers_delivery_id_when_present()
    {
        string id = ItsmInboundWebhookReplayEventId.Resolve(" deliv-9 ", "Jira", "KEY-1", "Done");

        id.Should().Be("deliv-9");
    }

    [Fact]
    public void Resolve_falls_back_to_synthetic_provider_key_status()
    {
        string id = ItsmInboundWebhookReplayEventId.Resolve(null, "Jira", "KEY-1", "Done");

        id.Should().Be("Jira:KEY-1:Done");
    }

    [Fact]
    public void BuildSynthetic_trims_provider_external_key_and_status()
    {
        string id = ItsmInboundWebhookReplayEventId.BuildSynthetic(" Jira ", " KEY-1 ", " Done ");

        id.Should().Be("Jira:KEY-1:Done");
    }

    [Fact]
    public void Resolve_explicit_delivery_id_is_authoritative_over_synthetic_fallback()
    {
        string id = ItsmInboundWebhookReplayEventId.Resolve(
            "arch-delivery-42",
            "Jira",
            "KEY-1",
            "Done");

        id.Should().Be("arch-delivery-42");
    }

    [Fact]
    public void Resolve_treats_whitespace_only_delivery_id_as_absent_for_synthetic_fallback()
    {
        string id = ItsmInboundWebhookReplayEventId.Resolve("   ", "Jira", "KEY-1", "Done");

        id.Should().Be("Jira:KEY-1:Done");
    }

    [Fact]
    public void Resolve_uses_explicit_colon_delimited_delivery_id_as_authoritative_replay_key()
    {
        const string explicitId = "vendor:Jira:KEY-1:Done";

        string id = ItsmInboundWebhookReplayEventId.Resolve(explicitId, "Jira", "KEY-1", "Done");

        id.Should().Be(explicitId);
        id.Should().NotBe(ItsmInboundWebhookReplayEventId.BuildSynthetic("Jira", "KEY-1", "Done"));
    }

    [Fact]
    public void Resolve_builds_distinct_synthetic_replay_ids_when_status_text_differs()
    {
        string first = ItsmInboundWebhookReplayEventId.Resolve(null, "Jira", "KEY-1", "Done");
        string second = ItsmInboundWebhookReplayEventId.Resolve(null, "Jira", "KEY-1", "In Progress");

        first.Should().Be("Jira:KEY-1:Done");
        second.Should().Be("Jira:KEY-1:In Progress");
        first.Should().NotBe(second);
    }
}
