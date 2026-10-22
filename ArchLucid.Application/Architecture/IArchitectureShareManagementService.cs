using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

public interface IArchitectureShareManagementService
{
    Task<ArchitectureShareListResult> GetSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task<ArchitectureShareUpsertResult> UpsertShareAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid userId,
        string role,
        string grantedBy,
        CancellationToken cancellationToken = default);

    Task<ArchitectureShareDeleteResult> DeleteShareAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid userId,
        CancellationToken cancellationToken = default);
}
