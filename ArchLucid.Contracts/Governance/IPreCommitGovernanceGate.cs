using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Governance;

/// <summary>Optional pre-commit governance evaluation (read-only).</summary>
public interface IPreCommitGovernanceGate
{
    Task<PreCommitGateResult> EvaluateAsync(string runId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Computes the gate against the persisted findings snapshot plus <paramref name="syntheticCount" /> in-memory
    ///     findings (no database writes).
    /// </summary>
    Task<PreCommitGateResult> SimulateSyntheticFindingsAsync(
        string runId,
        FindingSeverity syntheticSeverity,
        int syntheticCount,
        CancellationToken cancellationToken = default);
}
