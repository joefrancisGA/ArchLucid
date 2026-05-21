using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

public interface IPreCommitGovernanceBlockExplainer
{
    Task<string?> ExplainAsync(
        PreCommitGateResult gateResult,
        string truncatedManifestJson,
        CancellationToken cancellationToken);
}
