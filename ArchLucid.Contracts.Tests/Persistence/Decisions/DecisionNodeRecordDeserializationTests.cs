using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Decisions;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Decisions;

[Trait("Category", "Unit")]
public sealed class DecisionNodeRecordDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "options": null,
              "supportingEvaluationIds": null,
              "opposingEvaluationIds": null
            }
            """;

        DecisionNodeRecord? result =
            JsonSerializer.Deserialize<DecisionNodeRecord>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Options.Should().NotBeNull().And.BeEmpty();
        result.SupportingEvaluationIds.Should().NotBeNull().And.BeEmpty();
        result.OpposingEvaluationIds.Should().NotBeNull().And.BeEmpty();
    }
}
