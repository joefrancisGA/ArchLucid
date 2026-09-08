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
    public void Score_demotes_security_finding_with_only_label_shaped_graph_node_trace_evidence()
    {
        Finding finding = new()
        {
            FindingId = "engine-f8",
            Title = "Machine actor reaches sensitive datastore",
            Rationale = "Machine actor path to regulated datastore through allow-listed write/admin role.",
            Severity = FindingSeverity.Error,
            Category = "Security",
            Trace = new ExplainabilityTrace { Notes = ["evidence:graph-node:sql-pay-prod"] },
        };

        InsightDensityGateCandidate candidate = InsightDensityGateCandidate.FromFinding(finding);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(candidate.EvidenceRefs).Should().BeFalse();
        result.PenaltyReasons.Should().Contain("no-concrete-evidence");
        result.PenaltyReasons.Should().NotContain("falsifiability-signal");
    }

    [Fact]
    public void Score_promotes_security_finding_with_arm_evidence_ref()
    {
        const string storageArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod";

        Finding finding = new()
        {
            FindingId = "engine-f9",
            Title = "Machine actor reaches sensitive datastore",
            Rationale = "Machine actor path to regulated datastore through allow-listed write/admin role.",
            Severity = FindingSeverity.Error,
            Category = "Security",
            EvidenceRefs = [storageArmId],
            Trace = new ExplainabilityTrace { Notes = ["evidence:graph-node:sql-pay-prod"] },
        };

        InsightDensityGateCandidate candidate = InsightDensityGateCandidate.FromFinding(finding);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.Promote);
        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(candidate.EvidenceRefs).Should().BeTrue();
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
    public void Default_demotion_threshold_is_sixty_five()
    {
        InsightDensityGateOptions options = new();

        options.DemotionThreshold.Should().Be(65);
    }

    [Fact]
    public void Score_demotes_architecture_anchored_score_sixty_without_evidence_at_default_threshold()
    {
        InsightDensityGateCandidate candidate = new(
            "engine-f10",
            "No topology resources were found",
            [],
            FindingSeverity.Warning,
            category: "Topology",
            isAgentArchitectureFinding: false);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
        result.Classification.Should().Be(FindingClassification.ChecklistCoverage);
        result.InsightDensityScore.Should().Be(60);
    }

    [Fact]
    public void Score_promotes_architecture_anchored_score_sixty_without_evidence_when_threshold_is_fifty()
    {
        DeterministicInsightDensityGate lenientGate = new(
            Options.Create(new InsightDensityGateOptions { DemotionThreshold = 50 }));

        InsightDensityGateCandidate candidate = new(
            "engine-f11",
            "No topology resources were found",
            [],
            FindingSeverity.Warning,
            category: "Topology",
            isAgentArchitectureFinding: false);

        InsightDensityGateResult result = lenientGate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.Promote);
        result.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        result.InsightDensityScore.Should().Be(60);
    }

    [Fact]
    public void Score_promotes_product_shaped_arm_evidence_at_default_threshold_even_when_score_below_sixty_five()
    {
        const string storageArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod";

        Finding finding = new()
        {
            FindingId = "engine-f12",
            Title = "No topology resources were found",
            Severity = FindingSeverity.Warning,
            Category = "Topology",
            EvidenceRefs = [storageArmId],
        };

        InsightDensityGateCandidate candidate = InsightDensityGateCandidate.FromFinding(finding);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.Promote);
        result.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
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

    [Fact]
    public void Jaccard_similarity_treats_hyphenated_resource_tokens_as_space_separated_peers()
    {
        InsightDensityTextSimilarity.JaccardSimilarity(
                "Enable encryption for prod-sql-db storage account",
                "Enable encryption for prod sql db storage account")
            .Should()
            .BeGreaterThanOrEqualTo(0.85);
    }

    [Fact]
    public void Jaccard_similarity_treats_slash_separated_arm_path_tokens_as_space_separated_peers()
    {
        InsightDensityTextSimilarity.JaccardSimilarity(
                "Public endpoint on /subscriptions/abc/resourceGroups/rg/providers/Microsoft.Sql/servers/prod-db",
                "Public endpoint on subscriptions abc resourceGroups rg providers Microsoft Sql servers prod db")
            .Should()
            .BeGreaterThanOrEqualTo(0.85);
    }
}
