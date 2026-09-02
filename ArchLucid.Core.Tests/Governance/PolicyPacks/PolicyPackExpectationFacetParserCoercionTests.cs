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
    public void Parse_breach_severity_string_encoded_whole_number_ordinal_maps_label()
    {
        PolicyPackContentDocument document = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostBreachSeverity] = "2.0" },
        };

        PolicyPackExpectationFacetParser.Parse(document).BreachSeverity.Should().Be("2.0");
    }

    [Fact]
    public void Parse_breach_severity_string_encoded_boolean_maps_label()
    {
        PolicyPackContentDocument document = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostBreachSeverity] = "True" },
        };

        PolicyPackExpectationFacetParser.Parse(document).BreachSeverity.Should().Be("True");
    }
}
