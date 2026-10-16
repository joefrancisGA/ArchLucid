using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Risk;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Risk;

[Trait("Category", "Unit")]
public sealed class SuggestedConcernDeserializationTests
{
    [Fact]
    public void Deserialize_integer_out_of_range_source_throws()
    {
        const string json = """
            {
              "statement": "Test concern",
              "source": 99,
              "consequence": 0,
              "reversibility": 0
            }
            """;

        Action act = () => JsonSerializer.Deserialize<SuggestedConcern>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_integer_out_of_range_consequence_throws()
    {
        const string json = """
            {
              "statement": "Test concern",
              "source": 0,
              "consequence": 99,
              "reversibility": 0
            }
            """;

        Action act = () => JsonSerializer.Deserialize<SuggestedConcern>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_integer_out_of_range_reversibility_throws()
    {
        const string json = """
            {
              "statement": "Test concern",
              "source": 0,
              "consequence": 0,
              "reversibility": 99
            }
            """;

        Action act = () => JsonSerializer.Deserialize<SuggestedConcern>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_defined_risk_enums()
    {
        const string json = """
            {
              "statement": "Test concern",
              "source": 1,
              "consequence": 2,
              "reversibility": 1
            }
            """;

        SuggestedConcern concern = JsonSerializer.Deserialize<SuggestedConcern>(json, ContractJson.Default)!;

        concern.Source.Should().Be(ConcernSource.ExecutionCredibility);
        concern.Consequence.Should().Be(RiskConsequence.High);
        concern.Reversibility.Should().Be(ReversibilityClass.Costly);
    }

    [Fact]
    public void Deserialize_null_related_fact_refs_yields_empty_list_not_null()
    {
        const string json = """
            {
              "statement": "Test concern",
              "relatedFactRefs": null,
              "source": 0,
              "consequence": 0,
              "reversibility": 0
            }
            """;

        SuggestedConcern concern = JsonSerializer.Deserialize<SuggestedConcern>(json, ContractJson.Default)!;

        concern.RelatedFactRefs.Should().NotBeNull();
        concern.RelatedFactRefs.Should().BeEmpty();
    }
}
