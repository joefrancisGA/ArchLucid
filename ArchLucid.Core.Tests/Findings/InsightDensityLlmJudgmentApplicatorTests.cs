using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Suite", "Core")]
public sealed class InsightDensityLlmJudgmentApplicatorTests
{
    [Fact]
    public void ApplyToArchitectureFinding_demotes_when_flagged()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f1",
            Treatment = FindingTreatment.Promote,
            Classification = FindingClassification.DecisionGradeFinding,
            InsightDensityScore = 70,
        };

        InsightDensityLlmJudgment judgment = new()
        {
            FindingId = "f1",
            InsightDensityScore = 80,
            WhyThisIsNotGeneric = "Specific to PaymentDb.",
            PrincipalArchitectValue = "Principal care.",
            DecisionConsequence = "Redesign secret path.",
            DemoteToChecklist = true,
        };

        FindingInsightDensityLlmJudgmentApplicator.ApplyToArchitectureFinding(finding, judgment);

        finding.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
        finding.Classification.Should().Be(FindingClassification.ChecklistCoverage);
        finding.WhyThisIsNotGeneric.Should().Be("Specific to PaymentDb.");
    }

    [Fact]
    public void ApplyToArchitectureFinding_refines_score_from_existing_and_llm_values()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f1",
            InsightDensityScore = 60,
        };

        InsightDensityLlmJudgment judgment = new()
        {
            FindingId = "f1",
            InsightDensityScore = 80,
            DecisionConsequence = "Approve with compensating control.",
        };

        FindingInsightDensityLlmJudgmentApplicator.ApplyToArchitectureFinding(finding, judgment);

        finding.InsightDensityScore.Should().Be(70);
    }
}
