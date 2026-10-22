using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class UniversalIntakeMustQuestionCompletenessTests
{
    [Fact]
    public void EvaluateMissingKeys_returns_empty_when_every_key_is_answered()
    {
        Dictionary<string, string> answers = UniversalIntakeMustQuestionCompleteness.RequiredMustQuestionKeys
            .ToDictionary(static key => key, static key => $"answer-{key}");

        IReadOnlyList<string> missing = UniversalIntakeMustQuestionCompleteness.EvaluateMissingKeys(
            answers,
            transparencyTrail: null);

        missing.Should().BeEmpty();
    }

    [Fact]
    public void EvaluateMissingKeys_treats_explicit_skip_as_satisfied()
    {
        string mustKey = UniversalIntakeMustQuestionCompleteness.RequiredMustQuestionKeys[0];
        TransparencyTrail trail = new()
        {
            Skipped =
            [
                new SkippedQuestionTrailEntry
                {
                    QuestionKey = mustKey,
                    Tier = ElicitationQuestionTier.Must,
                },
            ],
        };

        IReadOnlyList<string> missing = UniversalIntakeMustQuestionCompleteness.EvaluateMissingKeys(
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
            trail);

        missing.Should().NotContain(mustKey);
    }

    [Fact]
    public void EnsureComplete_throws_for_unanswered_required_key()
    {
        string mustKey = UniversalIntakeMustQuestionCompleteness.RequiredMustQuestionKeys[0];

        Action act = () => UniversalIntakeMustQuestionCompleteness.EnsureComplete(
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
            transparencyTrail: null,
            [mustKey]);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage($"*{mustKey}*");
    }
}
