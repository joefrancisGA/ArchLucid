using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class FindingSemanticSupportBandFinalizeJudgeEligibilityTests
{
    [Fact]
    public void ShouldJudge_true_for_unchecked_decision_grade_with_citation()
    {
        Finding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            SemanticSupportBand = FindingSemanticSupportBand.Unchecked,
            EvidenceRefs = ["Gateway terminates TLS."],
        };

        FindingSemanticSupportBandFinalizeJudgeEligibility.ShouldJudge(finding).Should().BeTrue();
    }

    [Fact]
    public void ShouldJudge_false_for_checklist_coverage()
    {
        Finding finding = new()
        {
            Classification = FindingClassification.ChecklistCoverage,
            SemanticSupportBand = FindingSemanticSupportBand.Unchecked,
            EvidenceRefs = ["Gateway terminates TLS."],
        };

        FindingSemanticSupportBandFinalizeJudgeEligibility.ShouldJudge(finding).Should().BeFalse();
    }

    [Fact]
    public void ShouldJudge_false_when_citations_are_empty()
    {
        Finding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            SemanticSupportBand = FindingSemanticSupportBand.Unchecked,
            EvidenceRefs = ["   "],
        };

        FindingSemanticSupportBandFinalizeJudgeEligibility.ShouldJudge(finding).Should().BeFalse();
    }

    [Fact]
    public void ShouldJudge_false_for_heuristic_supported()
    {
        Finding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            SemanticSupportBand = FindingSemanticSupportBand.Supported,
            EvidenceRefs = ["Gateway terminates TLS."],
        };

        FindingSemanticSupportBandFinalizeJudgeEligibility.ShouldJudge(finding).Should().BeFalse();
    }
}
