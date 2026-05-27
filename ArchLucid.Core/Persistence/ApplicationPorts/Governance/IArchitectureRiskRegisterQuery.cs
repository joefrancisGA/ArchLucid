using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Governance;

public interface IArchitectureRiskRegisterQuery
{
    Task<IReadOnlyList<ArchitectureRiskRegisterEntry>> ListAsync(
        Guid tenantId,
        Guid? projectId,
        int maxRows,
        CancellationToken cancellationToken);
}
