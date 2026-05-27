using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

public interface IArchitectureDecisionRegisterService
{
    Task<ArchitectureDecisionRegisterResponse> GetRegisterAsync(
        Guid tenantId,
        Guid? projectId,
        int maxRows,
        ArchitectureDecisionRegisterQueryOptions? filters,
        CancellationToken cancellationToken = default);
}
