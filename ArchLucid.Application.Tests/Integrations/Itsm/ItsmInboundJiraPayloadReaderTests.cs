using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmInboundJiraPayloadReaderTests
{
    [Fact]
    public void TryRead_accepts_PascalCase_issue_fields_status_name()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"Issue":{"Key":"PROJ-1","Fields":{"Status":{"Name":"Done"}}}}""");

        bool ok = new ItsmInboundJiraPayloadReader().TryRead(document.RootElement, out ItsmInboundPayloadReadResult result);

        ok.Should().BeTrue();
        result.ExternalKey.Should().Be("PROJ-1");
        result.StatusValue.Should().Be("Done");
    }

    [Fact]
    public void TryRead_rejects_changelog_only_payload_without_issue_fields_status_name()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"issue":{"key":"PROJ-1"},"changelog":{"items":[{"field":"status","toString":"Done"}]}}""");

        bool ok = new ItsmInboundJiraPayloadReader().TryRead(document.RootElement, out ItsmInboundPayloadReadResult _);

        ok.Should().BeFalse("inbound Jira sync contract requires issue.fields.status.name; changelog-only bodies are out of scope");
    }
}
