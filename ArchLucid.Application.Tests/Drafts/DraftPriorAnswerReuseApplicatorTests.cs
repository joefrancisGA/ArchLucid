using ArchLucid.Application.Drafts.PriorAnswerReuse;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftPriorAnswerReuseApplicatorTests
{
    [Fact]
    public void Apply_copies_answers_from_prior_run_spawned_draft_when_current_draft_is_missing_them()
    {
        Guid sourceDraftId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        DraftRequestDocument document = new();
        DraftRequestResponse prior = new()
        {
            DraftId = sourceDraftId,
            Status = DraftRequestStatus.RunSpawned,
            Document = new DraftRequestDocument
            {
                QuestionAnswers =
                {
                    [UniversalIntakeQuestions.MustQuestions[0].QuestionKey] = "Prior pilot answer.",
                },
            },
        };

        DraftPriorAnswerReuseResult result = DraftPriorAnswerReuseApplicator.Apply(document, [prior]);

        result.ReusedCount.Should().Be(1);
        result.ReusedQuestionKeys.Should().ContainSingle()
            .Which.Should().Be(UniversalIntakeQuestions.MustQuestions[0].QuestionKey);
        document.QuestionAnswers.Should().ContainKey(UniversalIntakeQuestions.MustQuestions[0].QuestionKey);
        document.TransparencyTrail.Asserted.Should().Contain(entry =>
            entry.Key == $"reused.answer.{UniversalIntakeQuestions.MustQuestions[0].QuestionKey}"
            && entry.Value == sourceDraftId.ToString("D"));
    }

    [Fact]
    public void Apply_does_not_overwrite_answers_already_present_on_current_draft()
    {
        string questionKey = UniversalIntakeQuestions.MustQuestions[0].QuestionKey;
        DraftRequestDocument document = new()
        {
            QuestionAnswers = { [questionKey] = "Current draft answer." },
        };

        DraftRequestResponse prior = new()
        {
            DraftId = Guid.NewGuid(),
            Status = DraftRequestStatus.RunSpawned,
            Document = new DraftRequestDocument
            {
                QuestionAnswers = { [questionKey] = "Prior pilot answer." },
            },
        };

        DraftPriorAnswerReuseResult result = DraftPriorAnswerReuseApplicator.Apply(document, [prior]);

        result.ReusedCount.Should().Be(0);
        document.QuestionAnswers[questionKey].Should().Be("Current draft answer.");
    }
}
