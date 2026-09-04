using ArchLucid.Application.Runs.Orchestration.Commit;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityCommitSkippedMustBlockedReasonTests
{
    [Fact]
    public void Format_uses_singular_copy_for_one_skipped_must()
    {
        AuthorityCommitSkippedMustBlockedReason.Format(1).Should().Be("1 required question is unanswered.");
    }

    [Fact]
    public void Format_uses_plural_copy_for_multiple_skipped_must()
    {
        AuthorityCommitSkippedMustBlockedReason.Format(2).Should().Be("2 required questions are unanswered.");
    }
}
