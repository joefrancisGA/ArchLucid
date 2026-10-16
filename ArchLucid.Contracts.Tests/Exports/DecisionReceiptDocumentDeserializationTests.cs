using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Exports;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class DecisionReceiptDocumentDeserializationTests
{
    [Fact]
    public void Deserialize_null_verdict_and_cost_story_yields_non_null_nested_objects()
    {
        const string json = """
            {
              "source": 0,
              "verdict": null,
              "costStory": null
            }
            """;

        DecisionReceiptDocument? document =
            JsonSerializer.Deserialize<DecisionReceiptDocument>(json, ContractJson.CamelCaseCompact);

        document.Should().NotBeNull();
        document!.Verdict.Should().NotBeNull();
        document.CostStory.Should().NotBeNull();
    }

    [Fact]
    public void Deserialize_null_intake_remains_null()
    {
        const string json = """
            {
              "source": 0,
              "intake": null
            }
            """;

        DecisionReceiptDocument? document =
            JsonSerializer.Deserialize<DecisionReceiptDocument>(json, ContractJson.CamelCaseCompact);

        document.Should().NotBeNull();
        document!.Intake.Should().BeNull();
    }
}
