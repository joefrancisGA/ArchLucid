using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class RoiMetricSourceKindDeserializationTests
{
    [Fact]
    public void Deserialize_integer_out_of_range_source_kind_throws()
    {
        const string json = """
            {
              "metricKey": "llm.cost",
              "displayLabel": "LLM cost",
              "valueSummary": "$12",
              "sourceKind": 99,
              "citationDetail": "n/a"
            }
            """;

        Action act = () => JsonSerializer.Deserialize<RoiMetricSourceRow>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_defined_source_kind()
    {
        const string json = """
            {
              "metricKey": "llm.cost",
              "displayLabel": "LLM cost",
              "valueSummary": "$12",
              "sourceKind": 2,
              "citationDetail": "retail row"
            }
            """;

        RoiMetricSourceRow row = JsonSerializer.Deserialize<RoiMetricSourceRow>(json, ContractJson.Default)!;

        row.SourceKind.Should().Be(RoiMetricSourceKind.RetailPriceRow);
    }
}
