using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingEnforcementTierClassifierCoercionTests
{
    [Fact]
    public void ClassifyFinding_honors_string_encoded_whole_number_enforcement_tier_property()
    {
        Finding finding = new()
        {
            FindingId = "f-3",
            FindingType = "TopologyGap",
            Category = "Topology",
            EngineType = "TopologyCoverage",
            Severity = FindingSeverity.Warning,
            Title = "Gap",
            Rationale = "Gap",
            Properties = new Dictionary<string, string>
            {
                [FindingPropertyKeys.EnforcementTier] = "1.0",
            },
        };

        FindingEnforcementTierClassifier.ClassifyFinding(finding)
            .Should()
            .Be(FindingEnforcementTier.Advisory);
    }

    [Fact]
    public void ClassifyFinding_ignores_string_encoded_boolean_enforcement_tier_property()
    {
        Finding finding = new()
        {
            FindingId = "f-4",
            FindingType = "TopologyGap",
            Category = "Topology",
            EngineType = "TopologyCoverage",
            Severity = FindingSeverity.Warning,
            Title = "Gap",
            Rationale = "Gap",
            Properties = new Dictionary<string, string>
            {
                [FindingPropertyKeys.EnforcementTier] = "True",
            },
        };

        FindingEnforcementTierClassifier.ClassifyFinding(finding)
            .Should()
            .Be(FindingEnforcementTier.PolicyViolation);
    }

    [Fact]
    public void ClassifyFinding_ignores_string_encoded_false_boolean_over_standard_baseline_advisory()
    {
        Finding finding = new()
        {
            FindingId = "f-5",
            FindingType = "TopologyGap",
            Category = "Topology",
            EngineType = "TopologyCoverage",
            Severity = FindingSeverity.Warning,
            Title = "Gap",
            Rationale = "Gap",
            PolicyRuleId = "waf-az-004",
            Properties = new Dictionary<string, string>
            {
                [FindingPropertyKeys.EnforcementTier] = "False",
            },
        };

        FindingEnforcementTierClassifier.ClassifyFinding(finding)
            .Should()
            .Be(FindingEnforcementTier.Advisory);
    }

    [Fact]
    public void ClassifyFinding_ignores_on_synonym_enforcement_tier_property()
    {
        Finding finding = new()
        {
            FindingId = "f-6",
            FindingType = "TopologyGap",
            Category = "Topology",
            EngineType = "TopologyCoverage",
            Severity = FindingSeverity.Warning,
            Title = "Gap",
            Rationale = "Gap",
            Properties = new Dictionary<string, string>
            {
                [FindingPropertyKeys.EnforcementTier] = "on",
            },
        };

        FindingEnforcementTierClassifier.ClassifyFinding(finding)
            .Should()
            .Be(FindingEnforcementTier.PolicyViolation);
    }
}
