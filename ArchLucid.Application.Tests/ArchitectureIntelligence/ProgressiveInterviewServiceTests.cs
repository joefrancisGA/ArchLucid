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
    public void ApplyAnswers_marks_questions_answered_and_adds_user_asserted_evidence()
    {
        ArchitectureKnowledgeModel model = new ArchitectureOntologyService().CreateEmptyModel("tenant-1");
        ProgressiveInterviewState state = new()
        {
            ModelId = model.ModelId,
            FramingQuestions =
            [
                new FramingQuestion
                {
                    QuestionId = "business-outcome",
                    Prompt = "What business outcome?",
                    IsAnswered = false,
                    Source = FramingQuestionSource.Framing,
                },
            ],
            EvidenceDrivenQuestions =
            [
                new FramingQuestion
                {
                    QuestionId = "evidence-1",
                    Prompt = "Provide evidence for recovery objectives",
                    IsAnswered = false,
                    Source = FramingQuestionSource.EvidenceDriven,
                },
            ],
        };

        ProgressiveInterviewState updated = _service.ApplyAnswers(
            model,
            state,
            new Dictionary<string, string>
            {
                ["business-outcome"] = "Process claims faster",
                ["evidence-1"] = "RTO is 30 minutes with PITR enabled",
            });

        updated.FramingQuestions[0].IsAnswered.Should().BeTrue();
        updated.EvidenceDrivenQuestions[0].IsAnswered.Should().BeTrue();
        model.FramingAnswers.Should().ContainKey("business-outcome");
        model.Elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Evidence
            && element.Provenance.Origin == ClaimOrigin.UserAsserted);
    }

    [Fact]
    public void ApplyAnswers_twice_does_not_duplicate_evidence_elements()
    {
        ArchitectureKnowledgeModel model = new ArchitectureOntologyService().CreateEmptyModel("tenant-1");
        ProgressiveInterviewState state = new()
        {
            ModelId = model.ModelId,
            FramingQuestions =
            [
                new FramingQuestion
                {
                    QuestionId = "business-outcome",
                    Prompt = "What business outcome?",
                    IsAnswered = false,
                    Source = FramingQuestionSource.Framing,
                },
            ],
        };

        Dictionary<string, string> answers = new()
        {
            ["business-outcome"] = "Process claims faster",
        };

        state = _service.ApplyAnswers(model, state, answers);
        state = _service.ApplyAnswers(model, state, answers);

        model.Elements
            .Count(element => element.Kind == ArchitectureElementKind.Evidence)
            .Should().Be(1);
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
