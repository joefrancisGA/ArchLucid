using System.Text.Json;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopReasoningResultClonerTests
{
    [Fact]
    public void Clone_preserves_dictionary_product_finding_payload_runtime_type()
    {
        Dictionary<string, string> payload = new(StringComparer.Ordinal) { ["key"] = "value" };
        ClosedLoopReasoningResult source = new()
        {
            ProductFindings =
            [
                new Finding
                {
                    FindingId = "finding-payload",
                    FindingType = "gap",
                    Category = "security",
                    EngineType = "specialist",
                    Severity = FindingSeverity.Error,
                    Title = "Gap",
                    Rationale = "Rationale.",
                    Payload = payload,
                },
            ],
        };

        ClosedLoopReasoningResult cloned = ClosedLoopReasoningResultCloner.Clone(source);

        cloned.ProductFindings[0].Payload.Should().BeOfType<Dictionary<string, string>>();
        ((Dictionary<string, string>)cloned.ProductFindings[0].Payload!)["key"].Should().Be("value");
    }

    [Fact]
    public void Clone_preserves_json_element_product_finding_payload()
    {
        JsonElement payload = JsonSerializer.SerializeToElement(new { key = "value" });
        ClosedLoopReasoningResult source = new()
        {
            ProductFindings =
            [
                new Finding
                {
                    FindingId = "finding-json",
                    FindingType = "gap",
                    Category = "security",
                    EngineType = "specialist",
                    Severity = FindingSeverity.Error,
                    Title = "Gap",
                    Rationale = "Rationale.",
                    Payload = payload,
                },
            ],
        };

        ClosedLoopReasoningResult cloned = ClosedLoopReasoningResultCloner.Clone(source);

        cloned.ProductFindings[0].Payload.Should().BeOfType<JsonElement>();
        ((JsonElement)cloned.ProductFindings[0].Payload!).GetProperty("key").GetString().Should().Be("value");
    }
}
