using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Governance;

public interface IArchitectureRiskRegisterQuery
{
    Task<IReadOnlyList<ArchitectureRiskRegisterEntry>> ListAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        int maxRows,
        ArchitectureRiskRegisterListOptions? options = null,
        CancellationToken cancellationToken = default);

    Task<int> CountAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        ArchitectureRiskRegisterListOptions? options = null,
        CancellationToken cancellationToken = default);
}
