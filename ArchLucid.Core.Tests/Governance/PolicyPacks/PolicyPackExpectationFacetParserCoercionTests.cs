using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Governance.PolicyPacks;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PolicyPackExpectationFacetParserCoercionTests
{
    [Fact]
    public void Parse_require_budget_cap_string_encoded_whole_number_maps_true()
    {
        PolicyPackContentDocument document = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "1.0" },
        };

        PolicyPackExpectationFacetParser.Parse(document).RequireBudgetCap.Should().BeTrue();
    }

    [Fact]
    public void Parse_require_budget_cap_string_encoded_whole_number_maps_false()
    {
        PolicyPackContentDocument document = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "0.0" },
        };

        PolicyPackExpectationFacetParser.Parse(document).RequireBudgetCap.Should().BeFalse();
    }

    [Fact]
    public void Parse_require_budget_cap_string_encoded_boolean_maps_true()
    {
        PolicyPackContentDocument document = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "True" },
        };

        PolicyPackExpectationFacetParser.Parse(document).RequireBudgetCap.Should().BeTrue();
    }

    [Fact]
    public void Parse_require_budget_cap_string_encoded_boolean_maps_false()
    {
        PolicyPackContentDocument document = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "False" },
        };

        PolicyPackExpectationFacetParser.Parse(document).RequireBudgetCap.Should().BeFalse();
    }

    [Fact]
    public void Parse_require_budget_cap_on_off_synonyms_map_true_and_false()
    {
        PolicyPackContentDocument onDocument = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "on" },
        };
        PolicyPackExpectationFacetParser.Parse(onDocument).RequireBudgetCap.Should().BeTrue();

        PolicyPackContentDocument offDocument = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "off" },
        };
        PolicyPackExpectationFacetParser.Parse(offDocument).RequireBudgetCap.Should().BeFalse();
    }

    [Fact]
    public void Parse_require_budget_cap_enabled_disabled_synonyms_map_true_and_false()
    {
        PolicyPackContentDocument enabledDocument = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "enabled" },
        };
        PolicyPackExpectationFacetParser.Parse(enabledDocument).RequireBudgetCap.Should().BeTrue();

        PolicyPackContentDocument disabledDocument = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "disabled" },
        };
        PolicyPackExpectationFacetParser.Parse(disabledDocument).RequireBudgetCap.Should().BeFalse();
    }

    [Fact]
    public void Parse_breach_severity_string_encoded_whole_number_ordinal_maps_label()
    {
        PolicyPackContentDocument document = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostBreachSeverity] = "2.0" },
        };

        PolicyPackExpectationFacetParser.Parse(document).BreachSeverity.Should().Be(nameof(FindingSeverity.Error));
    }

    [Fact]
    public void Parse_breach_severity_string_encoded_boolean_ignores_label()
    {
        PolicyPackContentDocument document = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostBreachSeverity] = "True" },
        };

        PolicyPackExpectationFacetParser.Parse(document).BreachSeverity.Should().BeNull();
    }

    [Fact]
    public void Parse_breach_severity_on_synonym_ignores_label()
    {
        PolicyPackContentDocument document = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostBreachSeverity] = "on" },
        };

        PolicyPackExpectationFacetParser.Parse(document).BreachSeverity.Should().BeNull();
    }

    [Fact]
    public void Parse_breach_severity_off_synonym_maps_info_label()
    {
        PolicyPackContentDocument document = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostBreachSeverity] = "off" },
        };

        PolicyPackExpectationFacetParser.Parse(document).BreachSeverity.Should().Be(nameof(FindingSeverity.Info));
    }
}
