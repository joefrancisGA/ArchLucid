using ArchLucid.Application.Clarifications;
using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Clarifications;

[Trait("Category", "Unit")]
public sealed class ReviewClarificationDeltaComputerTests
{
    private readonly ReviewClarificationDeltaComputer _computer = new();

    [Fact]
    public void Compute_PartitionsResolvedAndStillOpenQuestionIds()
    {
        ReviewClarificationQuestion openQuestion = CreateQuestion("aaaaaaaaaaaaaaaa", "still-open");
        ReviewClarificationQuestion resolvedByAssertion = CreateQuestion("bbbbbbbbbbbbbbbb", "asserted");
        ReviewClarificationQuestion resolvedByEvidence = CreateQuestion("cccccccccccccccc", "evidence");

        ReviewClarificationDelta delta = _computer.Compute(
            priorRunId: "11111111111111111111111111111111",
            priorQuestions: [openQuestion, resolvedByAssertion, resolvedByEvidence],
            currentQuestions: [openQuestion],
            assertedQuestionIds: ["bbbbbbbbbbbbbbbb"]);

        delta.PriorRunId.Should().Be("11111111111111111111111111111111");
        delta.StillOpenQuestionIds.Should().Equal(["aaaaaaaaaaaaaaaa"]);
        delta.ResolvedByAssertionQuestionIds.Should().Equal(["bbbbbbbbbbbbbbbb"]);
        delta.ResolvedByEvidenceQuestionIds.Should().Equal(["cccccccccccccccc"]);
    }

    private static ReviewClarificationQuestion CreateQuestion(string questionId, string missingItem)
    {
        return new ReviewClarificationQuestion
        {
            QuestionId = questionId,
            Prompt = $"Resolve {missingItem}",
            SourceFindingId = Guid.NewGuid().ToString("N"),
            SourceFindingType = "TopologyCoverageFinding",
            Severity = FindingSeverity.Warning,
            MissingItem = missingItem,
        };
    }
}
