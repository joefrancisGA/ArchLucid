using ArchiForge.Contracts.Agents;

namespace ArchiForge.Data.Repositories;

public interface IAgentEvidencePackageRepository
{
    Task CreateAsync(
        AgentEvidencePackage evidencePackage,
        CancellationToken cancellationToken = default);

    Task<AgentEvidencePackage?> GetByRunIdAsync(
        string runId,
        CancellationToken cancellationToken = default);

    Task<AgentEvidencePackage?> GetByIdAsync(
        string evidencePackageId,
        CancellationToken cancellationToken = default);
}
