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
}
