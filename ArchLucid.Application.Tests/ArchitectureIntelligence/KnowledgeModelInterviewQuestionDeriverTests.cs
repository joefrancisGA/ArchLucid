using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class KnowledgeModelInterviewQuestionDeriverTests
{
    [Fact]
    public void Derive_ranks_blocked_check_questions_before_other_unresolved_questions()
    {
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "q-intake",
                    Kind = ArchitectureElementKind.UnresolvedQuestion,
                    Name = "business-outcome",
                    Description = "Business outcome is still brief",
                },
                new ArchitectureModelElement
                {
                    ElementId = "q-blocked",
                    Kind = ArchitectureElementKind.UnresolvedQuestion,
                    Name = "blocked-check:finding-42",
                    Description = "Policy pack threshold blocks finalize until disposition is recorded.",
                },
            ],
        };

        IReadOnlyList<ArchLucid.Contracts.Clarifications.ReviewClarificationQuestion> questions =
            KnowledgeModelInterviewQuestionDeriver.Derive(model);

        questions.Should().HaveCount(2);
        questions[0].QuestionId.Should().Be("km-q-blocked");
        questions[0].Severity.Should().Be(FindingSeverity.Error);
        questions[0].SourceFindingType.Should().Be("KnowledgeModel.BlockedCheck");
        questions[1].QuestionId.Should().Be("km-q-intake");
    }

    [Fact]
    public void Derive_returns_empty_when_model_is_null()
    {
        KnowledgeModelInterviewQuestionDeriver.Derive(null).Should().BeEmpty();
    }
}
