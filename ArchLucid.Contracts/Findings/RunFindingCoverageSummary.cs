namespace ArchLucid.Contracts.Findings;

/// <summary>First-class run outcome for finding-engine coverage (Batch A / TB-054 partial).</summary>
public sealed class RunFindingCoverageSummary
{
    /// <summary>Total engines invoked during snapshot generation (success + failure).</summary>
    public int EnginesAttempted
    {
        get;
        init;
    }

    /// <summary>Engines that returned findings without throwing.</summary>
    public int EnginesSucceeded
    {
        get;
        init;
    }

    /// <summary>Engines that failed during snapshot generation.</summary>
    public int EnginesFailed
    {
        get;
        init;
    }

    /// <summary>
    ///     <see langword="true" /> when the review completed with partial or failed finding coverage that is advisory-only
    ///     (committable under resolved Batch A policy).
    /// </summary>
    public bool IsDegraded
    {
        get;
        init;
    }

    /// <summary>
    ///     <see langword="true" /> when at least one failed engine is safety-critical and would block decisioning when strict
    ///     partial-finding halt is enabled.
    /// </summary>
    public bool HasCommitBlockingFailures
    {
        get;
        init;
    }

    /// <summary>Sanitized engine identifiers for operator UI (engine type + category, no exception text).</summary>
    public IReadOnlyList<string> FailedEngineLabels
    {
        get;
        init;
    } = [];

    /// <summary>Snapshot generation status persisted on the findings snapshot header.</summary>
    public FindingsSnapshotGenerationStatus GenerationStatus
    {
        get;
        init;
    } = FindingsSnapshotGenerationStatus.Complete;

    /// <summary>Governance disposition counts for findings on this run (null when snapshot missing).</summary>
    public RunFindingDispositionCoverage? DispositionCoverage
    {
        get;
        init;
    }
}
