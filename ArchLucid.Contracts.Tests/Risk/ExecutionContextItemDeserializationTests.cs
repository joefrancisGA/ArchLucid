using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Risk;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Risk;

[Trait("Category", "Unit")]
public sealed class ExecutionContextItemDeserializationTests
{
    [Fact]
    public void Deserialize_integer_out_of_range_disclosure_throws()
    {
        const string json = """
            {
              "itemKey": "exec.sponsor",
              "elicitationQuestionKey": "exec.sponsor",
              "disclosure": 99
            }
            """;

        Action act = () => JsonSerializer.Deserialize<ExecutionContextItem>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_defined_disclosure()
    {
        const string json = """
            {
              "itemKey": "exec.sponsor",
              "elicitationQuestionKey": "exec.sponsor",
              "disclosure": 2
            }
            """;

        ExecutionContextItem item = JsonSerializer.Deserialize<ExecutionContextItem>(json, ContractJson.Default)!;

        item.Disclosure.Should().Be(DisclosureState.Undisclosed);
    }
    [Fact]
    public void Deserialize_null_item_key_and_elicitation_question_key_yield_empty_strings_not_null()
    {
        const string json = """
            {
              "itemKey": null,
              "elicitationQuestionKey": null,
              "disclosure": 0
            }
            """;

        ExecutionContextItem? item =
            JsonSerializer.Deserialize<ExecutionContextItem>(json, ContractJson.Default);

        item.Should().NotBeNull();
        item!.ItemKey.Should().BeEmpty();
        item.ElicitationQuestionKey.Should().BeEmpty();
    }
}