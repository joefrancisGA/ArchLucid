using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Compliance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Compliance;

[Trait("Category", "Unit")]
public sealed class ComplianceRuleDeserializationTests
{
    [Fact]
    public void Deserialize_null_rule_headline_strings_yield_empty_strings_not_null()
    {
        const string json = """
            {
              "ruleId": null,
              "controlId": null,
              "controlName": null,
              "appliesToCategory": null,
              "requiredNodeType": null,
              "requiredEdgeType": null,
              "description": null
            }
            """;

        ComplianceRule? result =
            JsonSerializer.Deserialize<ComplianceRule>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.RuleId.Should().BeEmpty();
        result.ControlId.Should().BeEmpty();
        result.ControlName.Should().BeEmpty();
        result.AppliesToCategory.Should().BeEmpty();
        result.RequiredNodeType.Should().BeEmpty();
        result.RequiredEdgeType.Should().BeEmpty();
        result.Description.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_severity_and_priority_yield_defaults_not_null()
    {
        const string json = """
            {
              "ruleId": "r1",
              "severity": null,
              "priority": null
            }
            """;

        ComplianceRule? result =
            JsonSerializer.Deserialize<ComplianceRule>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Severity.Should().Be("Warning");
        result.Priority.Should().Be("P1");
    }

    [Fact]
    public void Deserialize_null_nested_rule_inside_pack_yields_empty_strings_not_null()
    {
        const string json = """
            {
              "rulePackId": "pack",
              "rules": [
                {
                  "ruleId": null,
                  "description": null,
                  "severity": null,
                  "priority": null
                }
              ]
            }
            """;

        ComplianceRulePack? pack =
            JsonSerializer.Deserialize<ComplianceRulePack>(json, ContractJson.CamelCaseCompact);

        pack.Should().NotBeNull();
        pack!.Rules.Should().ContainSingle();
        pack.Rules[0].RuleId.Should().BeEmpty();
        pack.Rules[0].Description.Should().BeEmpty();
        pack.Rules[0].Severity.Should().Be("Warning");
        pack.Rules[0].Priority.Should().Be("P1");
    }
}