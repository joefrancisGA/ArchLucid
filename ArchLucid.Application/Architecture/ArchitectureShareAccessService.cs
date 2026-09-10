using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

public sealed class ArchitectureShareAccessService(IArchitectureShareRepository shareRepository)
    : IArchitectureShareAccessService
{
    private readonly IArchitectureShareRepository _shareRepository =
        shareRepository ?? throw new ArgumentNullException(nameof(shareRepository));

    public async Task<ArchitectureShareAccessEvaluation> EvaluateAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid? actorUserId,
        bool hasReadAuthority,
        bool hasExecuteAuthority,
        bool hasWorkspaceAdminAuthority,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        bool? restrictToShares = await _shareRepository.TryGetRestrictToSharesAsync(
            scope,
            architectureId,
            cancellationToken);

        if (restrictToShares is null)
            return ArchitectureShareAccessEvaluation.ArchitectureNotFound();

        string? shareRole = null;

        if (actorUserId is Guid userId && userId != Guid.Empty)
        {
            shareRole = await _shareRepository.TryGetShareRoleAsync(
                scope,
                architectureId,
                userId,
                cancellationToken);
        }

        return ArchitectureShareAccessEvaluator.Evaluate(
            restrictToShares.Value,
            shareRole,
            hasReadAuthority,
            hasExecuteAuthority,
            hasWorkspaceAdminAuthority);
    }
}
