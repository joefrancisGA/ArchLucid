namespace ArchLucid.Contracts.Governance;

/// <summary>Optional pre-commit governance evaluation (read-only).</summary>
public interface IPreCommitGovernanceGate
{
    Task<PreCommitGateResult> EvaluateAsync(string runId, CancellationToken cancellationToken = default);
}
