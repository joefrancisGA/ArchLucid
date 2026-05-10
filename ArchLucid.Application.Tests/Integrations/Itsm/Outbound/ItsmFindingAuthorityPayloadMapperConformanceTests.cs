using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm.Outbound;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmFindingAuthorityPayloadMapperConformanceTests
{
    private const string ConnectorName = "ITSM finding authority payload mapper";

    [Fact]
    public void BuildSummaryAndDescription_uses_architecture_finding_message_and_preserves_correlation_paths_without_secrets()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-1",
            Severity = FindingSeverity.Warning,
            Message = "Cache miss rate exceeded policy threshold."
        };

        JsonElement payload = JsonSerializer.SerializeToElement(
            finding,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        (string summary, string description) = ItsmFindingAuthorityPayloadMapper.BuildSummaryAndDescription(
            finding.FindingId,
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            payload,
            decisionRuleName: "Latency budget",
            recommendedActions: ["Increase cache TTL", "Review dependency timeouts"]);

        summary.Should().Be(finding.Message, because: $"{ConnectorName}: summary must prefer authority finding message.");
        description.Should().Contain("findingId: f-1", because: $"{ConnectorName}: description must retain finding correlation.");
        description.Should().Contain("runId: 11111111111111111111111111111111", because: $"{ConnectorName}: run correlation must be present.");
        description.Should().Contain("Decision / category:", because: $"{ConnectorName}: decision/category line must be appended when provided.");
        description.Should().Contain("Latency budget", because: $"{ConnectorName}: decision rule name must appear in description.");
        description.Should().Contain("Recommended actions:", because: $"{ConnectorName}: recommended actions must be enumerated.");
        description.Should().Contain("Increase cache TTL", because: $"{ConnectorName}: each recommended action must be listed.");

        description.Should().NotContain("hooks.slack.com", because: $"{ConnectorName}: description must not embed vendor webhook hosts.");
    }
}
