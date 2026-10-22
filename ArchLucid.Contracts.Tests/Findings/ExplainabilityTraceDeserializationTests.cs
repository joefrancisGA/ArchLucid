using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class ExplainabilityTraceDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "graphNodeIdsExamined": null,
              "rulesApplied": null,
              "decisionsTaken": null,
              "alternativePathsConsidered": null,
              "notes": null,
              "citations": null
            }
            """;

        ExplainabilityTrace? trace =
            JsonSerializer.Deserialize<ExplainabilityTrace>(json, ContractJson.CamelCaseCompact);

        trace.Should().NotBeNull();
        trace!.GraphNodeIdsExamined.Should().NotBeNull().And.BeEmpty();
        trace.RulesApplied.Should().NotBeNull().And.BeEmpty();
        trace.DecisionsTaken.Should().NotBeNull().And.BeEmpty();
        trace.AlternativePathsConsidered.Should().NotBeNull().And.BeEmpty();
        trace.Notes.Should().NotBeNull().And.BeEmpty();
        trace.Citations.Should().NotBeNull().And.BeEmpty();
    }
}
