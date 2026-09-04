using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Governance.PolicyPacks;

[Trait("Category", "Unit")]
public sealed class ComplianceRuleApplicabilityFilterTests
{
    [Fact]
    public void FilterRules_returns_all_rules_when_context_is_null()
    {
        List<ComplianceRule> rules =
        [
            new() { RuleId = "a", Applicability = new ComplianceRuleApplicabilityConditions { CloudProviders = ["Azure"] } },
            new() { RuleId = "b" },
        ];

        IReadOnlyList<ComplianceRule> filtered =
            ComplianceRuleApplicabilityFilter.FilterRules(rules, applicabilityContext: null);

        filtered.Should().HaveCount(2);
    }

    [Fact]
    public void FilterRules_excludes_rules_when_cloud_provider_does_not_match()
    {
        List<ComplianceRule> rules =
        [
            new() { RuleId = "azure-only", Applicability = new ComplianceRuleApplicabilityConditions { CloudProviders = ["Azure"] } },
            new() { RuleId = "any-cloud" },
        ];

        ComplianceRuleApplicabilityContext context =
            ComplianceRuleApplicabilityContext.FromCloudProvider(CloudProvider.Aws);

        IReadOnlyList<ComplianceRule> filtered = ComplianceRuleApplicabilityFilter.FilterRules(rules, context);

        filtered.Select(rule => rule.RuleId).Should().Equal("any-cloud");
    }
}
