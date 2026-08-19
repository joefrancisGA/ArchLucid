using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class RunOperatorGovernanceDispositionValidationTests
{
    [Fact]
    public void ValidateApproveAllowed_throws_when_commit_blocking_failures()
    {
        Action act = () =>
            RunOperatorGovernanceDispositionValidation.ValidateApproveAllowed(
                RunOperatorGovernanceDecision.Approved,
                hasCommitBlockingFailures: true);

        act.Should().Throw<InvalidOperationException>();
    }
}
