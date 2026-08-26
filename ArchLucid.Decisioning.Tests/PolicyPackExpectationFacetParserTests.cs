using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class PolicyPackExpectationFacetParserTests
{
    [Fact]
    public void Parse_null_effective_returns_empty_facet()
    {
        PolicyPackExpectationFacet facet = PolicyPackExpectationFacetParser.Parse(null);

        facet.IsEmpty.Should().BeTrue();
    }

    [Fact]
    public void Parse_splits_pipe_separated_topology_and_skips_unknown()
    {
        PolicyPackContentDocument effective = new()
        {
            AdvisoryDefaults =
            {
                [PolicyPackExpectationAdvisoryKeys.TopologyCategoriesAdd] = "identity|bogus|network",
            },
        };

        PolicyPackExpectationFacet facet = PolicyPackExpectationFacetParser.Parse(effective);

        facet.ExtraTopologyCategories.Should().Equal("identity", "network");
    }

    [Fact]
    public void Parse_require_budget_cap_true_false_and_invalid()
    {
        PolicyPackContentDocument trueDoc = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "yes" },
        };
        PolicyPackExpectationFacetParser.Parse(trueDoc).RequireBudgetCap.Should().BeTrue();

        PolicyPackContentDocument falseDoc = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "0" },
        };
        PolicyPackExpectationFacetParser.Parse(falseDoc).RequireBudgetCap.Should().BeFalse();

        PolicyPackContentDocument invalidDoc = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "maybe" },
        };
        PolicyPackExpectationFacetParser.Parse(invalidDoc).RequireBudgetCap.Should().BeNull();
    }

    [Fact]
    public void Parse_breach_severity_valid_and_invalid()
    {
        PolicyPackContentDocument valid = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostBreachSeverity] = "Critical" },
        };
        PolicyPackExpectationFacetParser.Parse(valid).BreachSeverity.Should().Be("Critical");

        PolicyPackContentDocument invalid = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostBreachSeverity] = "Urgent" },
        };
        PolicyPackExpectationFacetParser.Parse(invalid).BreachSeverity.Should().BeNull();
    }
}
