using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Compliance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Compliance;

[Trait("Category", "Unit")]
public sealed class ComplianceRulePackDeserializationTests
{
    [Fact]
    public void Deserialize_null_version_yields_empty_string_not_null()
    {
        const string json = """
            {
              "rulePackId": "pack-1",
              "version": null
            }
            """;

        ComplianceRulePack? result =
            JsonSerializer.Deserialize<ComplianceRulePack>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Version.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_rules_yields_empty_list_not_null()
    {
        const string json = """
            {
              "rules": null
            }
            """;

        ComplianceRulePack? result =
            JsonSerializer.Deserialize<ComplianceRulePack>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Rules.Should().NotBeNull().And.BeEmpty();
    }
}
