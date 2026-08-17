using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Runs;

/// <summary>
///     Explicit legal transitions for <see cref="ArchitectureRunStatus" />.
///     Commit/finalize is pinned as <see cref="ArchitectureRunStatusLifecycleEvent.CommitFinalized" /> only.
/// </summary>
public static class ArchitectureRunStatusTransitionTable
{
    private static readonly ArchitectureRunStatusTransitionRule[] Rules =
    [
        Rule(ArchitectureRunStatus.Created, ArchitectureRunStatusLifecycleEvent.TasksMaterialized, ArchitectureRunStatus.TasksGenerated),
        Rule(ArchitectureRunStatus.Created, ArchitectureRunStatusLifecycleEvent.CoordinationPatchToCreated, ArchitectureRunStatus.Created),
        Rule(ArchitectureRunStatus.Created, ArchitectureRunStatusLifecycleEvent.CoordinationPatchToTasksGenerated, ArchitectureRunStatus.TasksGenerated),
        Rule(ArchitectureRunStatus.TasksGenerated, ArchitectureRunStatusLifecycleEvent.ExecuteMarksWaitingForResults, ArchitectureRunStatus.WaitingForResults),
        Rule(ArchitectureRunStatus.TasksGenerated, ArchitectureRunStatusLifecycleEvent.ExecuteCompletesToReadyForCommit, ArchitectureRunStatus.ReadyForCommit),
        Rule(ArchitectureRunStatus.TasksGenerated, ArchitectureRunStatusLifecycleEvent.ExecuteCompletesToPartiallyCompleted, ArchitectureRunStatus.PartiallyCompleted),
        Rule(ArchitectureRunStatus.TasksGenerated, ArchitectureRunStatusLifecycleEvent.ExecuteFailsToFailed, ArchitectureRunStatus.Failed),
        Rule(ArchitectureRunStatus.TasksGenerated, ArchitectureRunStatusLifecycleEvent.ExecuteFailsToFailedPartial, ArchitectureRunStatus.FailedPartial),
        Rule(ArchitectureRunStatus.TasksGenerated, ArchitectureRunStatusLifecycleEvent.QualityGateRejectsOutput, ArchitectureRunStatus.ExecutionCompletedQualityRejected),
        Rule(ArchitectureRunStatus.WaitingForResults, ArchitectureRunStatusLifecycleEvent.AgentResultsDeriveToWaitingForResults, ArchitectureRunStatus.WaitingForResults),
        Rule(ArchitectureRunStatus.WaitingForResults, ArchitectureRunStatusLifecycleEvent.AgentResultsDeriveToReadyForCommit, ArchitectureRunStatus.ReadyForCommit),
        Rule(ArchitectureRunStatus.WaitingForResults, ArchitectureRunStatusLifecycleEvent.ExecuteFailsToFailed, ArchitectureRunStatus.Failed),
        Rule(ArchitectureRunStatus.WaitingForResults, ArchitectureRunStatusLifecycleEvent.ExecuteFailsToFailedPartial, ArchitectureRunStatus.FailedPartial),
        Rule(ArchitectureRunStatus.PartiallyCompleted, ArchitectureRunStatusLifecycleEvent.ExecuteCompletesToReadyForCommit, ArchitectureRunStatus.ReadyForCommit),
        Rule(ArchitectureRunStatus.PartiallyCompleted, ArchitectureRunStatusLifecycleEvent.ExecuteCompletesToPartiallyCompleted, ArchitectureRunStatus.PartiallyCompleted),
        Rule(ArchitectureRunStatus.PartiallyCompleted, ArchitectureRunStatusLifecycleEvent.AgentResultsDeriveToWaitingForResults, ArchitectureRunStatus.WaitingForResults),
        Rule(ArchitectureRunStatus.PartiallyCompleted, ArchitectureRunStatusLifecycleEvent.ExecuteFailsToFailed, ArchitectureRunStatus.Failed),
        Rule(ArchitectureRunStatus.PartiallyCompleted, ArchitectureRunStatusLifecycleEvent.ExecuteFailsToFailedPartial, ArchitectureRunStatus.FailedPartial),
        Rule(ArchitectureRunStatus.FailedPartial, ArchitectureRunStatusLifecycleEvent.ExecuteCompletesToReadyForCommit, ArchitectureRunStatus.ReadyForCommit),
        Rule(ArchitectureRunStatus.FailedPartial, ArchitectureRunStatusLifecycleEvent.ExecuteCompletesToPartiallyCompleted, ArchitectureRunStatus.PartiallyCompleted),
        Rule(ArchitectureRunStatus.FailedPartial, ArchitectureRunStatusLifecycleEvent.AgentResultsDeriveToWaitingForResults, ArchitectureRunStatus.WaitingForResults),
        Rule(ArchitectureRunStatus.FailedPartial, ArchitectureRunStatusLifecycleEvent.ExecuteFailsToFailed, ArchitectureRunStatus.Failed),
        Rule(ArchitectureRunStatus.FailedPartial, ArchitectureRunStatusLifecycleEvent.ExecuteFailsToFailedPartial, ArchitectureRunStatus.FailedPartial),
        Rule(ArchitectureRunStatus.ReadyForCommit, ArchitectureRunStatusLifecycleEvent.ExecuteCompletesToReadyForCommit, ArchitectureRunStatus.ReadyForCommit),
        Rule(ArchitectureRunStatus.ReadyForCommit, ArchitectureRunStatusLifecycleEvent.CommitFinalized, ArchitectureRunStatus.Committed),
        Rule(ArchitectureRunStatus.Failed, ArchitectureRunStatusLifecycleEvent.RetryRequested, ArchitectureRunStatus.Retrying),
        Rule(ArchitectureRunStatus.Retrying, ArchitectureRunStatusLifecycleEvent.TasksMaterialized, ArchitectureRunStatus.TasksGenerated),
        Rule(ArchitectureRunStatus.Created, ArchitectureRunStatusLifecycleEvent.OwnershipLeaseExpiredReconcileToFailed, ArchitectureRunStatus.Failed),
        Rule(ArchitectureRunStatus.Created, ArchitectureRunStatusLifecycleEvent.OwnershipLeaseExpiredReconcileToFailedPartial, ArchitectureRunStatus.FailedPartial),
        Rule(ArchitectureRunStatus.TasksGenerated, ArchitectureRunStatusLifecycleEvent.OwnershipLeaseExpiredReconcileToFailed, ArchitectureRunStatus.Failed),
        Rule(ArchitectureRunStatus.TasksGenerated, ArchitectureRunStatusLifecycleEvent.OwnershipLeaseExpiredReconcileToFailedPartial, ArchitectureRunStatus.FailedPartial),
        Rule(ArchitectureRunStatus.WaitingForResults, ArchitectureRunStatusLifecycleEvent.OwnershipLeaseExpiredReconcileToFailed, ArchitectureRunStatus.Failed),
        Rule(ArchitectureRunStatus.WaitingForResults, ArchitectureRunStatusLifecycleEvent.OwnershipLeaseExpiredReconcileToFailedPartial, ArchitectureRunStatus.FailedPartial),
        Rule(ArchitectureRunStatus.Retrying, ArchitectureRunStatusLifecycleEvent.OwnershipLeaseExpiredReconcileToFailed, ArchitectureRunStatus.Failed),
        Rule(ArchitectureRunStatus.Retrying, ArchitectureRunStatusLifecycleEvent.OwnershipLeaseExpiredReconcileToFailedPartial, ArchitectureRunStatus.FailedPartial),
    ];

    public static IReadOnlyList<ArchitectureRunStatusTransitionRule> DocumentedRules => Rules;

    public static bool IsLegalTransition(
        ArchitectureRunStatus from,
        ArchitectureRunStatusLifecycleEvent lifecycleEvent,
        ArchitectureRunStatus to)
    {
        foreach (ArchitectureRunStatusTransitionRule rule in Rules)
        {
            if (rule.From == from && rule.LifecycleEvent == lifecycleEvent && rule.To == to)
                return true;
        }

        return false;
    }

    public static ArchitectureRunStatusTransitionResult TryTransition(
        ArchitectureRunStatus from,
        ArchitectureRunStatusLifecycleEvent lifecycleEvent)
    {
        ArchitectureRunStatus? target = null;

        foreach (ArchitectureRunStatusTransitionRule rule in Rules)
        {
            if (rule.From != from || rule.LifecycleEvent != lifecycleEvent)
                continue;

            if (target is not null && target != rule.To)
            {
                return ArchitectureRunStatusTransitionResult.Denied(
                    $"Lifecycle event '{lifecycleEvent}' is ambiguous from status '{from}'.",
                    from);
            }

            target = rule.To;
        }

        if (target is null)
        {
            return ArchitectureRunStatusTransitionResult.Denied(
                $"Transition '{lifecycleEvent}' is not legal from status '{from}'.",
                from);
        }

        return ArchitectureRunStatusTransitionResult.Allowed(target.Value);
    }

    public static void AssertLegal(
        ArchitectureRunStatus from,
        ArchitectureRunStatusLifecycleEvent lifecycleEvent,
        ArchitectureRunStatus to)
    {
        if (!IsLegalTransition(from, lifecycleEvent, to))
        {
            throw new InvalidOperationException(
                $"Illegal run status transition: {from} + {lifecycleEvent} → {to}.");
        }
    }

    public static bool TryParseStatus(string? legacyRunStatus, out ArchitectureRunStatus status)
    {
        if (string.IsNullOrWhiteSpace(legacyRunStatus))
        {
            status = ArchitectureRunStatus.Created;
            return true;
        }

        if (!Enum.TryParse(legacyRunStatus, ignoreCase: true, out ArchitectureRunStatus parsed)
            || !Enum.IsDefined(parsed))
        {
            status = default;
            return false;
        }

        status = parsed;
        return true;
    }

    private static ArchitectureRunStatusTransitionRule Rule(
        ArchitectureRunStatus from,
        ArchitectureRunStatusLifecycleEvent lifecycleEvent,
        ArchitectureRunStatus to) =>
        new(from, lifecycleEvent, to);
}
