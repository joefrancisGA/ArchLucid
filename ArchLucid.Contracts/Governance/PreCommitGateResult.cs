using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>Outcome of evaluating whether manifest commit is allowed under governance policy.</summary>
public sealed class PreCommitGateResult
{
    public bool Blocked
    {
        get;
        init;
    }

    public string? Reason
    {
        get;
        init;
    }

    private IReadOnlyList<string> blockingFindingIds = [];

    public IReadOnlyList<string> BlockingFindingIds
    {
        get => blockingFindingIds;
        init => blockingFindingIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Policy pack identifier (string form) that enforced the gate, when applicable.</summary>
    public string? PolicyPackId
    {
        get;
        init;
    }

    /// <summary>
    ///     The effective minimum severity (ordinal from <c>FindingSeverity</c>) that triggered the block, when
    ///     applicable.
    /// </summary>
    public int? MinimumBlockingSeverity
    {
        get;
        init;
    }

    /// <summary>When true, findings met the threshold but the severity is in the warn-only list; commit is allowed.</summary>
    public bool WarnOnly
    {
        get;
        init;
    }

    /// <summary>Warning messages when <see cref="WarnOnly" /> is true.</summary>
    private IReadOnlyList<string> warnings = [];

    public IReadOnlyList<string> Warnings
    {
        get => warnings;
        init => warnings = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public string? BlockExplanation
    {
        get;
        init;
    }

    public static PreCommitGateResult Allowed()
    {
        return new PreCommitGateResult { Blocked = false };
    }
}
