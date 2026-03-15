using ArchiForge.Contracts.Agents;
using ArchiForge.Contracts.Requests;

namespace ArchiForge.Application.Evidence;

public interface IEvidenceBuilder
{
    Task<AgentEvidencePackage> BuildAsync(
        string runId,
        ArchitectureRequest request,
        CancellationToken cancellationToken = default);
}
