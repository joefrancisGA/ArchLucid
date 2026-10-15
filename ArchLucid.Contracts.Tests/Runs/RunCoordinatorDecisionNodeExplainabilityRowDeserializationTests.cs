using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class RunCoordinatorDecisionNodeExplainabilityRowDeserializationTests
{
    [Fact]
    public void Deserialize_null_evaluation_id_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "supportingEvaluationIds": null,
              "opposingEvaluationIds": null
            }
            """;

        RunCoordinatorDecisionNodeExplainabilityRow? row =
            JsonSerializer.Deserialize<RunCoordinatorDecisionNodeExplainabilityRow>(json, ContractJson.CamelCaseCompact);

        row.Should().NotBeNull();
        row!.SupportingEvaluationIds.Should().NotBeNull().And.BeEmpty();
        row.OpposingEvaluationIds.Should().NotBeNull().And.BeEmpty();
    }
}
