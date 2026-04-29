namespace ArchLucid.Contracts.Findings;

/// <summary>Whether a <see cref="ArchLucid.Decisioning.Models.FindingsSnapshot" /> is safe to bind into a commit/finalize transaction.</summary>
public enum FindingsSnapshotGenerationStatus
{
    /// <summary>Snapshot row exists but findings pipeline has not sealed the snapshot.</summary>
    Generating = 1,

    /// <summary>All configured engines completed without failures recorded on the snapshot.</summary>
    Complete = 2,

    /// <summary>At least one engine failed but some findings were persisted.</summary>
    PartiallyComplete = 3,

    /// <summary>No usable findings were produced for policy/commit eligibility.</summary>
    Failed = 4
}
