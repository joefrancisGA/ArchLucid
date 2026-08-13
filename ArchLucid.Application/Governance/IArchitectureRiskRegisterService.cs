using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

public interface IArchitectureRiskRegisterService
{
    Task<ArchitectureRiskRegisterResponse> GetRegisterAsync(
        Guid tenantId,
        Guid? projectId,
        int maxRows,
        ArchitectureRiskRegisterListOptions? options = null,
        CancellationToken cancellationToken = default);
}
