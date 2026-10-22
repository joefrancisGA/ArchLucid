using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Runs;

using FluentAssertions;

using FsCheck;
using FsCheck.Xunit;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunStatusTransitionTableTests
{
    [Fact]
    public void Documented_rules_are_exhaustively_legal()
    {
        foreach (ArchitectureRunStatusTransitionRule rule in ArchitectureRunStatusTransitionTable.DocumentedRules)
        {
            ArchitectureRunStatusTransitionTable.IsLegalTransition(rule.From, rule.LifecycleEvent, rule.To).Should().BeTrue();
        }
    }

    [Fact]
    public void Commit_finalized_is_only_legal_from_ready_for_commit()
    {
        foreach (ArchitectureRunStatus status in Enum.GetValues<ArchitectureRunStatus>())
        {
            bool legal = ArchitectureRunStatusTransitionTable.IsLegalTransition(
                status,
                ArchitectureRunStatusLifecycleEvent.CommitFinalized,
                ArchitectureRunStatus.Committed);

            if (status is ArchitectureRunStatus.ReadyForCommit)
                legal.Should().BeTrue();
            else
                legal.Should().BeFalse($"status {status} must not reach Committed via finalize CAS");
        }
    }

    [Fact]
    public void Committed_has_no_outbound_transitions()
    {
        foreach (ArchitectureRunStatusLifecycleEvent lifecycleEvent in Enum.GetValues<ArchitectureRunStatusLifecycleEvent>())
        {
            foreach (ArchitectureRunStatus to in Enum.GetValues<ArchitectureRunStatus>())
            {
                ArchitectureRunStatusTransitionTable.IsLegalTransition(
                    ArchitectureRunStatus.Committed,
                    lifecycleEvent,
                    to).Should().BeFalse();
            }
        }
    }

    [Fact]
    public void TryTransition_matches_documented_rules()
    {
        foreach (ArchitectureRunStatusTransitionRule rule in ArchitectureRunStatusTransitionTable.DocumentedRules)
        {
            ArchitectureRunStatusTransitionResult result =
                ArchitectureRunStatusTransitionTable.TryTransition(rule.From, rule.LifecycleEvent);

            result.IsAllowed.Should().BeTrue();
            result.TargetStatus.Should().Be(rule.To);
        }
    }

    [Property(MaxTest = 100)]
    public void Random_undefined_status_bytes_are_never_emitted_as_targets(byte fromRaw, byte eventRaw)
    {
        if (!Enum.IsDefined(typeof(ArchitectureRunStatus), (ArchitectureRunStatus)fromRaw))
            return;

        if (!Enum.IsDefined(typeof(ArchitectureRunStatusLifecycleEvent), (ArchitectureRunStatusLifecycleEvent)eventRaw))
            return;

        ArchitectureRunStatus from = (ArchitectureRunStatus)fromRaw;
        ArchitectureRunStatusLifecycleEvent lifecycleEvent = (ArchitectureRunStatusLifecycleEvent)eventRaw;
        ArchitectureRunStatusTransitionResult result = ArchitectureRunStatusTransitionTable.TryTransition(from, lifecycleEvent);

        if (!result.IsAllowed)
            return;

        Enum.IsDefined(result.TargetStatus).Should().BeTrue();
        ((int)result.TargetStatus).Should().BeInRange(1, 10);
    }

    [Fact]
    public void Production_writer_allowlist_documents_direct_legacy_status_assignments()
    {
        ArchitectureRunStatusTransitionWritersAllowlist.Entries.Should().NotBeEmpty();
        ArchitectureRunStatusTransitionWritersAllowlist.Entries
            .Should()
            .OnlyContain(e => !string.IsNullOrWhiteSpace(e.RelativePath) && !string.IsNullOrWhiteSpace(e.DocumentedEvents));
    }
}
