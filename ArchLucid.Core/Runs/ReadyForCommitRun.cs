using ArchLucid.Contracts.Common;
using ArchLucid.Core.Identity;

namespace ArchLucid.Core.Runs;

/// <summary>
///     Typestate handle proving a run is in <see cref="ArchitectureRunStatus.ReadyForCommit" /> and may finalize
///     via <see cref="ArchitectureRunStatusLifecycleEvent.CommitFinalized" /> only.
/// </summary>
public readonly struct ReadyForCommitRun
{
    public ReadyForCommitRun(RunId runId)
    {
        if (runId.Value == Guid.Empty)
            throw new ArgumentException("RunId must be non-empty.", nameof(runId));

        RunId = runId;
    }

    public RunId RunId { get; }

    public ArchitectureRunStatusLifecycleEvent FinalizeLifecycleEvent { get; } =
        ArchitectureRunStatusLifecycleEvent.CommitFinalized;

    public ArchitectureRunStatus ExpectedCommittedStatus { get; } = ArchitectureRunStatus.Committed;

    public void ValidateLockedRunStatus(ArchitectureRunStatus lockedStatus)
    {
        if (lockedStatus is not ArchitectureRunStatus.ReadyForCommit)
            throw new InvalidOperationException(
                $"ReadyForCommitRun handle for '{RunId}' requires status ReadyForCommit but observed '{lockedStatus}'.");
    }

    public void ValidateRunId(Guid runId)
    {
        if (runId != RunId.Value)
            throw new InvalidOperationException(
                $"ReadyForCommitRun handle RunId '{RunId}' does not match finalize request '{runId:D}'.");
    }
}
