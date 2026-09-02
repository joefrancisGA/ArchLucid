using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Governance.PolicyPacks;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PolicyPackExpectationFacetIsEmptyTests
{
    [Fact]
    public void Parse_explicit_false_require_budget_cap_facet_is_not_empty()
    {
        PolicyPackContentDocument document = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "0" },
        };

        PolicyPackExpectationFacet facet = PolicyPackExpectationFacetParser.Parse(document);

        facet.RequireBudgetCap.Should().BeFalse();
        facet.IsEmpty.Should().BeFalse();
        ReferenceEquals(facet, PolicyPackExpectationFacet.Empty).Should().BeFalse();
    }

    [Fact]
    public void Parse_explicit_true_require_budget_cap_facet_is_not_empty()
    {
        PolicyPackContentDocument document = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "yes" },
        };

        PolicyPackExpectationFacet facet = PolicyPackExpectationFacetParser.Parse(document);

        facet.RequireBudgetCap.Should().BeTrue();
        facet.IsEmpty.Should().BeFalse();
    }
}
