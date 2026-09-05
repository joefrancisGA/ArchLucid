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
    public void Score_category_protects_typed_engine_finding_like_agent_finding()
    {
        InsightDensityGateCandidate candidate = new(
            "engine-f3",
            "Use HTTPS for all public endpoints.",
            ["request"],
            FindingSeverity.Info,
            category: "Security",
            isAgentArchitectureFinding: false);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.Promote);
        result.PenaltyReasons.Should().Contain("category-protected");
        result.PenaltyReasons.Should().Contain("typed-engine-scored");
    }

    [Fact]
    public void Score_protects_substantive_agent_categories_from_demotion()
    {
        InsightDensityGateCandidate candidate = new(
            "agent-f1",
            "Use HTTPS for all public endpoints.",
            ["request"],
            FindingSeverity.Info,
            category: "Security",
            isAgentArchitectureFinding: true);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(FindingTreatment.Promote);
        result.PenaltyReasons.Should().Contain("category-protected");
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
