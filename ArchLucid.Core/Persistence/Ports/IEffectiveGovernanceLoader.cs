using ArchLucid.Contracts.Governance;

namespace ArchLucid.Core.Persistence.Ports;

public interface IEffectiveGovernanceLoader
{
    Task<PolicyPackContentDocument> LoadEffectiveContentAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);
}
