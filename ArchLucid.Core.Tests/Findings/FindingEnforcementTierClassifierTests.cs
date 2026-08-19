using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Suite", "Core")]
public sealed class FindingEnforcementTierClassifierTests
{
    [Fact]
    public void ClassifyArchitectureFinding_marks_standard_baseline_policy_rule_as_advisory()
    {
        ArchitectureFinding finding = new()
        {
            Message = "Reliability redundancy is undocumented.",
            PolicyRuleId = "waf-az-001",
        };

        FindingEnforcementTierClassifier.ClassifyArchitectureFinding(finding)
            .Should()
            .Be(FindingEnforcementTier.Advisory);
    }

    [Fact]
    public void ClassifyArchitectureFinding_marks_aws_standard_baseline_policy_rule_as_advisory()
    {
        ArchitectureFinding finding = new()
        {
            Message = "AWS reliability baseline gap.",
            PolicyRuleId = "waf-aws-001",
        };

        FindingEnforcementTierClassifier.ClassifyArchitectureFinding(finding)
            .Should()
            .Be(FindingEnforcementTier.Advisory);
    }

    [Fact]
    public void ClassifyArchitectureFinding_marks_gcp_standard_baseline_policy_rule_as_advisory()
    {
        ArchitectureFinding finding = new()
        {
            Message = "GCP CIS baseline gap.",
            PolicyRuleId = "cis-gcp-001",
        };

        FindingEnforcementTierClassifier.ClassifyArchitectureFinding(finding)
            .Should()
            .Be(FindingEnforcementTier.Advisory);
    }

    [Fact]
    public void ClassifyArchitectureFinding_marks_obvious_generic_advice_as_advisory()
    {
        ArchitectureFinding finding = new()
        {
            Message = "Enable MFA for all user accounts.",
            EvidenceRefs = ["critic-checklist"],
        };

        FindingEnforcementTierClassifier.ClassifyArchitectureFinding(finding)
            .Should()
            .Be(FindingEnforcementTier.Advisory);
    }

    [Fact]
    public void ClassifyArchitectureFinding_marks_specific_architecture_finding_as_policy_violation()
    {
        ArchitectureFinding finding = new()
        {
            Message = "SecretManagementUnderSpecified",
            EvidenceRefs = ["doc:manifest.json#services"],
        };

        FindingEnforcementTierClassifier.ClassifyArchitectureFinding(finding)
            .Should()
            .Be(FindingEnforcementTier.PolicyViolation);
    }

    [Fact]
    public void ClassifyFinding_marks_policy_coverage_as_advisory()
    {
        Finding finding = new()
        {
            FindingId = "f-1",
            FindingType = "PolicyCoverageFinding",
            Category = "Policy",
            EngineType = "policy-coverage",
            Severity = FindingSeverity.Warning,
            Title = "Coverage gap",
            Rationale = "Coverage gap",
        };

        FindingEnforcementTierClassifier.ClassifyFinding(finding)
            .Should()
            .Be(FindingEnforcementTier.Advisory);
    }
}
