using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Unified server-side finalize readiness for an architecture run — composes career-artifact,
///     integrity, scorecard, and checklist gates without duplicating commit enforcement.
/// </summary>
public sealed class FinalizeReadinessResult
{
    public string RunId
    {
        get;
        init;
    } = null!;

    /// <summary>True when no blocking layer reports a finalize block for this run.</summary>
    public bool ReadyToFinalize
    {
        get;
        init;
    }

    /// <summary>Human-readable union of all blocking messages (space-joined), or null when ready.</summary>
    public string? BlockedReasonSummary
    {
        get;
        init;
    }

    private IReadOnlyList<FinalizeReadinessBlock> blocks = [];

    public IReadOnlyList<FinalizeReadinessBlock> Blocks
    {
        get => blocks;
        init => blocks = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public PreFinalizeChecklistResult Checklist
    {
        get;
        init;
    } = null!;

    public FinalizeQualityScorecardCountsDto Scorecard
    {
        get;
        init;
    } = null!;

    private IReadOnlyList<string> scorecardBlockingReasons = [];

    public IReadOnlyList<string> ScorecardBlockingReasons
    {
        get => scorecardBlockingReasons;
        init => scorecardBlockingReasons = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public bool FinalizeQualityGateEnabled
    {
        get;
        init;
    }
}
