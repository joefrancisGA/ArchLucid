using ArchLucid.Application.Runs.Orchestration.Commit;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityCommitSkippedMustGateTests
{
    [Fact]
    public void Evaluate_returns_null_when_trail_is_null()
    {
        AuthorityCommitSkippedMustGate.Evaluate(null).Should().BeNull();
    }

    [Fact]
    public void Evaluate_returns_null_when_only_should_tier_skipped()
    {
        TransparencyTrail trail = new()
        {
            Skipped =
            [
                new SkippedQuestionTrailEntry
                {
                    Tier = ElicitationQuestionTier.Should,
                    QuestionKey = "scale.requestsPerSecond",
                },
            ],
        };

        AuthorityCommitSkippedMustGate.Evaluate(trail).Should().BeNull();
    }

    [Fact]
    public void Evaluate_blocks_when_must_tier_skipped()
    {
        TransparencyTrail trail = new()
        {
            Skipped =
            [
                new SkippedQuestionTrailEntry
                {
                    Tier = ElicitationQuestionTier.Must,
                    QuestionKey = "security.dataClassification",
                },
                new SkippedQuestionTrailEntry
                {
                    Tier = ElicitationQuestionTier.Must,
                    QuestionKey = "actors.primaryUsers",
                },
            ],
        };

        PreCommitGateResult? result = AuthorityCommitSkippedMustGate.Evaluate(trail);

        result.Should().NotBeNull();
        result!.Blocked.Should().BeTrue();
        result.Reason.Should().Be("2 required questions are unanswered.");
    }

    [Fact]
    public void Evaluate_uses_singular_copy_for_one_skipped_must()
    {
        TransparencyTrail trail = new()
        {
            Skipped =
            [
                new SkippedQuestionTrailEntry
                {
                    Tier = ElicitationQuestionTier.Must,
                    QuestionKey = "security.dataClassification",
                },
            ],
        };

        PreCommitGateResult? result = AuthorityCommitSkippedMustGate.Evaluate(trail);

        result.Should().NotBeNull();
        result!.Reason.Should().Be("1 required question is unanswered.");
    }
}
