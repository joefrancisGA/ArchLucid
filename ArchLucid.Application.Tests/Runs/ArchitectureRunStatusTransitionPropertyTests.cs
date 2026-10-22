using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Runs;

using FluentAssertions;

using FsCheck;
using FsCheck.Xunit;

namespace ArchLucid.Application.Tests.Runs;

/// <summary>Lightweight lifecycle enum invariants (complements <see cref="RunLifecycleStatePropertyTests"/>).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunStatusTransitionPropertyTests
{
    [Property(MaxTest = 50)]
    public void All_enum_values_are_within_documented_range(byte raw)
    {
        if (!Enum.IsDefined(typeof(ArchitectureRunStatus), (ArchitectureRunStatus)raw))
            return;

        ArchitectureRunStatus status = (ArchitectureRunStatus)raw;
        int v = (int)status;

        // Includes TB-937 terminal/partial states: PartiallyCompleted=9, FailedPartial=10.
        v.Should().BeInRange(1, 10);
    }

    [SkippableFact]
    public void Terminal_statuses_for_commit_include_Committed_and_Failed()
    {
        ArchitectureRunStatus.Committed.Should().Be((ArchitectureRunStatus)5);
        ArchitectureRunStatus.Failed.Should().Be((ArchitectureRunStatus)6);
    }

    [SkippableFact]
    public void Pre_commit_eligible_statuses_are_ordered_before_Committed()
    {
        ((int)ArchitectureRunStatus.ReadyForCommit).Should().BeLessThan((int)ArchitectureRunStatus.Committed);
        ((int)ArchitectureRunStatus.TasksGenerated).Should().BeLessThan((int)ArchitectureRunStatus.Committed);
    }

    [Property(MaxTest = 80)]
    public void Illegal_commit_finalized_pairs_are_rejected(byte fromRaw)
    {
        if (!Enum.IsDefined(typeof(ArchitectureRunStatus), (ArchitectureRunStatus)fromRaw))
            return;

        ArchitectureRunStatus from = (ArchitectureRunStatus)fromRaw;

        if (from is ArchitectureRunStatus.ReadyForCommit)
            return;

        ArchitectureRunStatusTransitionResult result =
            ArchitectureRunStatusTransitionTable.TryTransition(from, ArchitectureRunStatusLifecycleEvent.CommitFinalized);

        result.IsAllowed.Should().BeFalse();
        result.TargetStatus.Should().Be(from);
        result.DenialReason.Should().NotBeNullOrWhiteSpace();
    }
}
