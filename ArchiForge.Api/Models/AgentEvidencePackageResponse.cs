using ArchiForge.Contracts.Agents;

namespace ArchiForge.Api.Models;

public sealed class AgentEvidencePackageResponse
{
    public AgentEvidencePackage Evidence { get; set; } = new();
}
