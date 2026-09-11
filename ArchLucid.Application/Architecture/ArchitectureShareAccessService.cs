using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

public sealed class ArchitectureShareAccessService(
    IArchitectureIdentityRepository architectureIdentityRepository,
    IArchitectureShareRepository shareRepository) : IArchitectureShareAccessService
{
    private readonly IArchitectureIdentityRepository _architectureIdentityRepository =
        architectureIdentityRepository ?? throw new ArgumentNullException(nameof(architectureIdentityRepository));

    private readonly IArchitectureShareRepository _shareRepository =
        shareRepository ?? throw new ArgumentNullException(nameof(shareRepository));

    public async Task<ArchitectureShareAccessEvaluation> EvaluateAsync(
        ScopeContext scope,
        Guid architectureId,
        string? actorOid,
        bool hasReadAuthority,
        bool hasExecuteAuthority,
        bool hasWorkspaceAdminAuthority,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        ArchitectureIdentityRecord? architecture = await _architectureIdentityRepository.GetByIdAsync(
            scope,
            architectureId,
            cancellationToken);

        if (architecture is null)
            return ArchitectureShareAccessEvaluation.ArchitectureNotFound();

        ArchitectureShareRecord? share = null;

        if (!string.IsNullOrWhiteSpace(actorOid))
        {
            share = await _shareRepository.TryGetAsync(
                scope,
                architectureId,
                actorOid,
                cancellationToken);
        }

        return new ArchitectureShareAccessEvaluation
        {
            ArchitectureFound = true,
            RestrictToShares = architecture.RestrictToShares,
            ShareRole = share?.Role,
            CanRead = hasReadAuthority && ArchitectureShareAccessEvaluator.CanView(architecture, share),
            CanDecide = ArchitectureShareAccessEvaluator.CanDecide(architecture, share, hasExecuteAuthority),
            CanAdmin = ArchitectureShareAccessEvaluator.CanAdmin(architecture, share),
        };
    }
}
