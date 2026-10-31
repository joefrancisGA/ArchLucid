using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class SpecialistReviewPassFindingTitleHonestyTests
{
    [Fact]
    public void Ai_pass_title_does_not_claim_absence_of_ai_as_stored_fact()
    {
        SpecialistReviewAiSpecificRiskRules rules = new();
        SpecialistReviewFinding finding = rules.Review(new ArchitectureKnowledgeModel(), []);

        finding.Conclusion.Should().Be(ReviewConclusion.Pass);
        finding.Title.Should().Be("AI or LLM usage was not found in the submitted text.");
    }

    [Fact]
    public void Data_architecture_pass_title_does_not_claim_absence_of_sensitive_data()
    {
        SpecialistReviewDataArchitectureRules rules = new();
        SpecialistReviewFinding finding = rules.Review(new ArchitectureKnowledgeModel(), []);

        finding.Conclusion.Should().Be(ReviewConclusion.Pass);
        finding.Title.Should().Be("Sensitive-data language was not found in the submitted text.");
    }

    [Fact]
    public void Security_pass_title_does_not_claim_clean_bill_of_health()
    {
        SpecialistReviewService service = new();
        SpecialistReviewResult result = service.Review(
            new ArchitectureKnowledgeModel(),
            [QualityDimension.Security]);

        SpecialistReviewFinding finding = result.Findings.Single();
        finding.Conclusion.Should().Be(ReviewConclusion.Pass);
        finding.Title.Should().Be("No public endpoint without a trust boundary was found in the model.");
    }
}
