using ArchLucid.Contracts.Common;
using ArchLucid.Core.Runs;

namespace ArchLucid.Application.Tests.Runs;

/// <summary>In-memory run lifecycle model for model-based testing (Prompt 9).</summary>
public sealed class ArchitectureRunLifecycleModel
{
    public ArchitectureRunStatus Status { get; private set; } = ArchitectureRunStatus.Created;

    public bool Sealed { get; private set; }

    public bool ProposalApplied { get; private set; }

    public bool PersistBeforeLlm { get; private set; }

    public ArchitectureRunLifecycleTransitionResult TryApply(ArchitectureRunLifecycleCommand command)
    {
        switch (command)
        {
            case ArchitectureRunLifecycleCommand.Create:
                return Allow();

            case ArchitectureRunLifecycleCommand.Execute:
                if (Status is ArchitectureRunStatus.Created)
                {
                    ArchitectureRunLifecycleTransitionResult materialize =
                        ApplyLifecycleEvent(ArchitectureRunStatusLifecycleEvent.CoordinationPatchToTasksGenerated);

                    if (!materialize.IsAllowed)
                        return materialize;
                }

                return ApplyLifecycleEvent(ResolveExecuteEvent());

            case ArchitectureRunLifecycleCommand.Propose:
                ProposalApplied = true;
                return Allow();

            case ArchitectureRunLifecycleCommand.RejectProposal:
                ProposalApplied = false;
                return Allow();

            case ArchitectureRunLifecycleCommand.Crash:
                return ApplyLifecycleEvent(ArchitectureRunStatusLifecycleEvent.ExecuteFailsToFailed);

            case ArchitectureRunLifecycleCommand.Resume:
                return ApplyLifecycleEvent(ArchitectureRunStatusLifecycleEvent.TasksMaterialized);

            case ArchitectureRunLifecycleCommand.Commit:
                if (!PersistBeforeLlm)
                    return Deny("Commit requires persist-before-LLM.");

                if (!ProposalApplied)
                    return Deny("Commit requires an applied proposal.");

                return ApplyLifecycleEvent(ArchitectureRunStatusLifecycleEvent.CommitFinalized);

            case ArchitectureRunLifecycleCommand.Replay:
                return Allow();

            case ArchitectureRunLifecycleCommand.LateWorkerWrite:
                if (Sealed)
                    return Deny("Late worker write forbidden after seal.");

                return Allow();

            default:
                return Deny("Unknown lifecycle command.");
        }
    }

    public void MarkPersistBeforeLlm() => PersistBeforeLlm = true;

    private ArchitectureRunStatusLifecycleEvent ResolveExecuteEvent()
    {
        if (!PersistBeforeLlm)
            return ArchitectureRunStatusLifecycleEvent.ExecuteFailsToFailed;

        if (!ProposalApplied)
            return ArchitectureRunStatusLifecycleEvent.ExecuteCompletesToPartiallyCompleted;

        return ArchitectureRunStatusLifecycleEvent.ExecuteCompletesToReadyForCommit;
    }

    private ArchitectureRunLifecycleTransitionResult ApplyLifecycleEvent(ArchitectureRunStatusLifecycleEvent lifecycleEvent)
    {
        ArchitectureRunStatusTransitionResult tableResult =
            ArchitectureRunStatusTransitionTable.TryTransition(Status, lifecycleEvent);

        if (!tableResult.IsAllowed)
            return Deny(tableResult.DenialReason ?? "Transition denied.");

        Status = tableResult.TargetStatus;

        if (lifecycleEvent is ArchitectureRunStatusLifecycleEvent.CommitFinalized)
            Sealed = true;

        return Allow();
    }

    private static ArchitectureRunLifecycleTransitionResult Allow() => new(true, null);

    private static ArchitectureRunLifecycleTransitionResult Deny(string reason) => new(false, reason);
}

public enum ArchitectureRunLifecycleCommand
{
    Create = 1,
    Execute = 2,
    Propose = 3,
    RejectProposal = 4,
    Crash = 5,
    Resume = 6,
    Commit = 7,
    Replay = 8,
    LateWorkerWrite = 9,
}

public readonly record struct ArchitectureRunLifecycleTransitionResult(bool IsAllowed, string? DenialReason);
