namespace ArchLucid.Contracts.Governance;

/// <summary>Outcome of evaluating whether manifest commit is allowed under governance policy.</summary>
public sealed class PreCommitGateResult
{
    public bool Blocked { get; init; }

    public string? Reason { get; init; }

    public IReadOnlyList<string> BlockingFindingIds { get; init; } = Array.Empty<string>();

    /// <summary>Policy pack identifier (string form) that enforced the gate, when applicable.</summary>
    public string? PolicyPackId { get; init; }

    public static PreCommitGateResult Allowed() => new() { Blocked = false };
}
