using System.Text;

using ArchLucid.Api.Services.Admin;
using ArchLucid.Persistence.IntegrationOutbox;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Services.Admin;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class IntegrationEventDeadLetterCurlFormatterTests
{
    [Fact]
    public void Format_builds_post_with_cloudevents_headers_and_payload()
    {
        IntegrationEventOutboxEntry entry = new()
        {
            OutboxId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            EventType = "archlucid.run.completed",
            PayloadUtf8 = Encoding.UTF8.GetBytes("{\"runId\":\"abc\"}"),
            TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            CreatedUtc = DateTime.UtcNow,
        };

        string curl = IntegrationEventDeadLetterCurlFormatter.Format(
            entry,
            "https://receiver.example/integration-events");

        curl.Should().Contain("curl -X POST 'https://receiver.example/integration-events'");
        curl.Should().Contain("Content-Type: application/cloudevents+json");
        curl.Should().Contain("ce-type: archlucid.run.completed");
        curl.Should().Contain("ce-id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        curl.Should().Contain("ce-source: archlucid/integration-outbox");
        curl.Should().Contain("{\"runId\":\"abc\"}");
    }

    [Fact]
    public void Format_uses_placeholder_url_when_receiver_is_unset()
    {
        IntegrationEventOutboxEntry entry = new()
        {
            OutboxId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            EventType = "archlucid.run.completed",
            PayloadUtf8 = Encoding.UTF8.GetBytes("{}"),
            TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            CreatedUtc = DateTime.UtcNow,
        };

        string curl = IntegrationEventDeadLetterCurlFormatter.Format(entry, receiverUrl: null);

        curl.Should().Contain("https://YOUR-WEBHOOK-RECEIVER.example/integration-events");
    }

    [Fact]
    public void Format_escapes_single_quotes_in_payload()
    {
        IntegrationEventOutboxEntry entry = new()
        {
            OutboxId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            EventType = "archlucid.run.completed",
            PayloadUtf8 = Encoding.UTF8.GetBytes("{\"message\":\"it's fine\"}"),
            TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            CreatedUtc = DateTime.UtcNow,
        };

        string curl = IntegrationEventDeadLetterCurlFormatter.Format(
            entry,
            "https://receiver.example/integration-events");

        curl.Should().Contain("it'\\''s fine");
    }

    [Fact]
    public void Format_throws_when_entry_is_null()
    {
        Action act = () => IntegrationEventDeadLetterCurlFormatter.Format(null!, "https://receiver.example");

        act.Should().Throw<ArgumentNullException>();
    }
}
