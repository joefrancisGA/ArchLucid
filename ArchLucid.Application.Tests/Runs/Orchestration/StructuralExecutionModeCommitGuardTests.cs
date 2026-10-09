using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class StructuralExecutionModeCommitGuardTests
{
    [Fact]
    public void GetBlockingReasons_when_mixed_or_fallback_blocks_before_downstream_integrity_evaluators()
    {
        StructuralExecutionModeCommitGuard.GetBlockingReasons(StructuralExecutionMode.Mixed)
            .Should()
            .ContainSingle()
            .Which.Should()
            .Contain("Mixed");

        StructuralExecutionModeCommitGuard.GetBlockingReasons(StructuralExecutionMode.Fallback)
            .Should()
            .ContainSingle()
            .Which.Should()
            .Contain("Fallback");
    }
}
