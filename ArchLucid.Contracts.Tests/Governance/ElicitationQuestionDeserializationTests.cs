using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ElicitationQuestionDeserializationTests
{
    [Fact]
    public void Deserialize_null_rule_keys_yields_empty_list_not_null()
    {
        const string json = """
            {
              "questionKey": "q1",
              "prompt": "prompt",
              "tier": 0,
              "answerKind": 0,
              "ruleKeys": null
            }
            """;

        ElicitationQuestion question = JsonSerializer.Deserialize<ElicitationQuestion>(json, ContractJson.Default)!;

        question.RuleKeys.Should().NotBeNull().And.BeEmpty();
    }
}
