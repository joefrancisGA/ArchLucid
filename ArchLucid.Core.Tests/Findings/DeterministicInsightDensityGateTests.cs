using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Suite", "Core")]
public sealed class DeterministicInsightDensityGateTests
{
    private static readonly IInsightDensityGate Gate =
        new DeterministicInsightDensityGate(Options.Create(new InsightDensityGateOptions()));

    [Fact]
    public void Score_demotes_generic_typed_engine_finding_without_anchor_or_evidence()
    {
        InsightDensityGateCandidate candidate = new(
            "engine-f1",
            "Enable MFA for all user accounts.",
            ["critic-checklist"],
            FindingSeverity.Warning,
            category: "Insight",
            isAgentArchitectureFinding: false);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
        result.Classification.Should().Be(FindingClassification.ChecklistCoverage);
        result.PenaltyReasons.Should().Contain("typed-engine-scored");
        result.InsightDensityScore.Should().BeLessThan(50);
    }

    [Fact]
    public void Score_promotes_typed_engine_finding_with_architecture_anchor()
    {
        InsightDensityGateCandidate candidate = new(
            "engine-f2",
            "SecretManagementUnderSpecified",
            ["doc:manifest.json#services"],
            FindingSeverity.Warning,
            category: "Security",
            isAgentArchitectureFinding: false);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.Promote);
        result.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        result.PenaltyReasons.Should().Contain("typed-engine-scored");
    }

    [Fact]
    public void Score_demotes_security_category_generic_https_without_resolvable_evidence()
    {
        InsightDensityGateCandidate candidate = new(
            "engine-f3",
            "Use HTTPS for all public endpoints.",
            ["request"],
            FindingSeverity.Info,
            category: "Security",
            isAgentArchitectureFinding: false);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
        result.Classification.Should().Be(FindingClassification.ChecklistCoverage);
        result.PenaltyReasons.Should().Contain("typed-engine-scored");
        result.PenaltyReasons.Should().NotContain("category-protected");
    }

    [Fact]
    public void Score_demotes_security_category_generic_https_for_agent_finding_without_evidence()
    {
        InsightDensityGateCandidate candidate = new(
            "agent-f1",
            "Use HTTPS for all public endpoints.",
            ["request"],
            FindingSeverity.Info,
            category: "Security",
            isAgentArchitectureFinding: true);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
        result.PenaltyReasons.Should().NotContain("category-protected");
    }

    [Fact]
    public void Score_demotes_generic_advice_without_anchor_or_concrete_evidence()
    {
        InsightDensityGateCandidate candidate = new(
            "f1",
            "Enable MFA for all user accounts.",
            ["critic-checklist"],
            FindingSeverity.Warning,
            category: "Insight",
            isAgentArchitectureFinding: true);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
        result.Classification.Should().Be(FindingClassification.ChecklistCoverage);
        result.InsightDensityScore.Should().BeLessThan(50);
        result.PenaltyReasons.Should().Contain("generic-advice");
    }

    [Fact]
    public void Score_promotes_architecture_specific_under_specified_finding()
    {
        InsightDensityGateCandidate candidate = new(
            "f2",
            "SecretManagementUnderSpecified",
            ["doc:manifest.json#services"],
            FindingSeverity.Warning);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.Promote);
        result.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        result.InsightDensityScore.Should().BeGreaterThan(50);
    }

    [Fact]
    public void Score_demotes_generic_mfa_on_named_service_without_resolvable_evidence()
    {
        InsightDensityGateCandidate candidate = new(
            "engine-f4",
            "Enable MFA on CheckoutApi before production rollout.",
            ["request"],
            FindingSeverity.Error,
            category: "Security",
            isAgentArchitectureFinding: false);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
        result.Classification.Should().Be(FindingClassification.ChecklistCoverage);
    }

    [Fact]
    public void Score_demotes_under_specified_title_without_resolvable_evidence()
    {
        InsightDensityGateCandidate candidate = new(
            "engine-f5",
            "SecretManagementUnderSpecified",
            ["request"],
            FindingSeverity.Warning,
            category: "Security",
            isAgentArchitectureFinding: false);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
        result.PenaltyReasons.Should().NotContain("falsifiability-signal");
    }

    [Fact]
    public void Score_demotes_when_only_related_node_ids_would_have_been_evidence()
    {
        Finding finding = new()
        {
            FindingId = "engine-f6",
            Title = "Enable MFA for all user accounts.",
            Severity = FindingSeverity.Warning,
            Category = "Security",
            RelatedNodeIds = ["node-checkout-api"],
            Trace = new ExplainabilityTrace { Notes = ["evidence:request"] },
        };

        InsightDensityGateCandidate candidate = InsightDensityGateCandidate.FromFinding(finding);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
        candidate.EvidenceRefs.Should().NotContain("node-checkout-api");
    }

    [Fact]
    public void Score_promotes_policy_backed_finding_via_policy_rule_evidence_ref()
    {
        Finding finding = new()
        {
            FindingId = "engine-f7",
            Title = "Use HTTPS for all public endpoints.",
            Severity = FindingSeverity.Info,
            Category = "Security",
            PolicyRuleId = "cis-az-006",
            Trace = new ExplainabilityTrace { Notes = ["evidence:request"] },
        };

        InsightDensityGateCandidate candidate = InsightDensityGateCandidate.FromFinding(finding);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.Promote);
        candidate.EvidenceRefs.Should().Contain("policy-rule:cis-az-006");
    }

    [Fact]
    public void Score_detects_new_lexicon_phrases()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice("Ensure scalability for all tiers.").Should().BeTrue();
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice("Add monitoring for production workloads.").Should().BeTrue();
    }

    [Fact]
    public void Score_applies_duplication_penalty_for_near_duplicate_peers()
    {
        InsightDensityGateCandidate first = new(
            "f-a",
            "Enable MFA for all user accounts in production.",
            ["critic-checklist"],
            FindingSeverity.Warning);
        InsightDensityGateCandidate second = new(
            "f-b",
            "Enable MFA for all user accounts in production environments.",
            ["critic-checklist"],
            FindingSeverity.Warning);

        InsightDensityGateResult result = Gate.Score(first, [first, second]);

        result.PenaltyReasons.Should().Contain(match => match.Contains("duplication", StringComparison.Ordinal));
    }

    [Fact]
    public void Score_respects_custom_demotion_threshold()
    {
        DeterministicInsightDensityGate strictGate = new(
            Options.Create(new InsightDensityGateOptions { DemotionThreshold = 90 }));

        InsightDensityGateCandidate candidate = new(
            "f3",
            "Use HTTPS for all public endpoints.",
            ["request"],
            FindingSeverity.Info,
            category: "Insight",
            isAgentArchitectureFinding: true);

        InsightDensityGateResult result = strictGate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
    }

    [Fact]
    public void Jaccard_similarity_is_one_for_identical_messages()
    {
        InsightDensityTextSimilarity.JaccardSimilarity(
                "Enable MFA for production accounts",
                "Enable MFA for production accounts")
            .Should()
            .Be(1);
    }
}
