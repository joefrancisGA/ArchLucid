using ArchLucid.Application.Runs.Orchestration.Commit;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityCommitTransparencyTrailCompletenessGateTests
{
    [Fact]
    public void Evaluate_blocks_when_trail_is_null()
    {
        PreCommitGateResult? result = AuthorityCommitTransparencyTrailCompletenessGate.Evaluate(null);

        result.Should().NotBeNull();
        result!.Blocked.Should().BeTrue();
        result.Reason.Should().Be(AuthorityCommitTransparencyTrailIncompleteBlockedReason.MissingTrail);
    }

    [Fact]
    public void Evaluate_allows_empty_sections()
    {
        TransparencyTrail trail = new();

        AuthorityCommitTransparencyTrailCompletenessGate.Evaluate(trail).Should().BeNull();
    }
}
