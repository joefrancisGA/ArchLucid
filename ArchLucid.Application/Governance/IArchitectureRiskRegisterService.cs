using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

public interface IArchitectureRiskRegisterService
{
    Task<ArchitectureRiskRegisterResponse> GetRegisterAsync(
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
