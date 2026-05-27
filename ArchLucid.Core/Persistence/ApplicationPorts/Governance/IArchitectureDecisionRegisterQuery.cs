using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Governance;

public interface IArchitectureDecisionRegisterQuery
{
    Task<IReadOnlyList<ArchitectureDecisionRegisterEntry>> ListAsync(
        Guid tenantId,
        Guid? projectId,
        int maxRows,
        CancellationToken cancellationToken);
}
