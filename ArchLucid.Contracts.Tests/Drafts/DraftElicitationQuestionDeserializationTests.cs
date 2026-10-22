using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftElicitationQuestionDeserializationTests
{
    [Fact]
    public void Deserialize_null_rule_keys_yields_empty_list_not_null()
    {
        const string json = """
            {
              "ruleKeys": null
            }
            """;

        DraftElicitationQuestion? result =
            JsonSerializer.Deserialize<DraftElicitationQuestion>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.RuleKeys.Should().NotBeNull().And.BeEmpty();
    }
}
