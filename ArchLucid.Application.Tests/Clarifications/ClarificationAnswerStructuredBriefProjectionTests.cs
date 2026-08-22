using ArchLucid.Application.Clarifications;
using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Clarifications;

[Trait("Category", "Unit")]
public sealed class ClarificationAnswerStructuredBriefProjectionTests
{
    private readonly DraftRequestProjector _projector = new();

    [Fact]
    public void Project_MapsConfirmedAssumptions_FromClarificationAnswerProjection()
    {
        string questionId = ReviewClarificationQuestionIdBuilder.Build(
            "TopologyCoverageFinding",
            "Compute");
        string formatted = OperatorAssertedClarificationAnswerFormatter.Format(
            questionId,
            "The API tier runs on Azure App Service.");

        DraftRequestDocument document = new()
        {
            FreeTextIntent = "Retail checkout modernization with Azure App Service and SQL.",
            StructuredBrief = new ArchitectureDraftStructuredBrief
            {
                ConfirmedAssumptions = [formatted],
            },
        };

        Contracts.Requests.ArchitectureRequest request = _projector.Project(document, Guid.NewGuid());

        request.Assumptions.Should().Contain(formatted);
        OperatorAssertedClarificationAnswerParser.TryParse(formatted, out ParsedClarificationAnswer parsed).Should().BeTrue();
        parsed.QuestionId.Should().Be(questionId);
        parsed.Answer.Should().Be("The API tier runs on Azure App Service.");
    }

    [Fact]
    public void ProjectConfirmedAssumptions_FormatsEachAnswer()
    {
        IReadOnlyList<string> assumptions = ClarificationAnswerProjection.ProjectConfirmedAssumptions(
        [
            new KeyValuePair<string, string>("aaaaaaaaaaaaaaaa", "Answer one."),
            new KeyValuePair<string, string>("bbbbbbbbbbbbbbbb", "Answer two."),
        ]);

        assumptions.Should().HaveCount(2);
        assumptions.Should().AllSatisfy(static assumption =>
            assumption.Should().StartWith(OperatorAssertedClarificationAnswerFormatter.Prefix));
    }
}
