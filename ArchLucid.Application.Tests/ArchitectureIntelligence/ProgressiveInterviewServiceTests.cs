using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ProgressiveInterviewServiceTests
{
    private readonly ProgressiveInterviewService _service = new();

    [Fact]
    public void BuildFramingState_infers_architecture_kind_and_leaves_unanswered_questions()
    {
        ArchitectureKnowledgeModel model = new ArchitectureOntologyService().CreateEmptyModel("tenant-1");
        List<ClosedLoopReasoningSourceText> sources =
        [
            new()
            {
                FileName = "context.md",
                ContentType = "text/markdown",
                Content = "This is a migration from monolith to services.",
            },
        ];

        ProgressiveInterviewState state = _service.BuildFramingState(model, sources);

        model.FramingAnswers.Should().ContainKey("architecture-kind");
        state.FramingQuestions.Should().NotBeEmpty();
        state.IsFramingComplete.Should().BeFalse();
    }

    [Fact]
    public void DeriveEvidenceDrivenQuestions_creates_questions_for_indeterminate_insufficient_findings()
    {
        SpecialistReviewResult specialistResult = new()
        {
            Dimension = QualityDimension.Reliability,
            Findings =
            [
                new SpecialistReviewFinding
                {
                    FindingId = "finding-1",
                    Dimension = QualityDimension.Reliability,
                    Title = "Missing RTO",
                    Rationale = "No recovery objective documented.",
                    Conclusion = ReviewConclusion.Indeterminate,
                    EvidenceCondition = EvidenceCondition.Insufficient,
                    Severity = "Medium",
                },
            ],
        };

        IReadOnlyList<FramingQuestion> questions = _service.DeriveEvidenceDrivenQuestions([specialistResult]);

        questions.Should().ContainSingle();
        questions[0].Source.Should().Be(FramingQuestionSource.EvidenceDriven);
    }
}
