using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

public sealed class ArchitectureRestrictToSharesService(
    IArchitectureIdentityRepository architectureIdentityRepository,
    IArchitectureShareRepository shareRepository) : IArchitectureRestrictToSharesService
{
    private readonly IArchitectureIdentityRepository _architectureIdentityRepository =
        architectureIdentityRepository ?? throw new ArgumentNullException(nameof(architectureIdentityRepository));

    private readonly IArchitectureShareRepository _shareRepository =
        shareRepository ?? throw new ArgumentNullException(nameof(shareRepository));

    public async Task<ArchitectureRestrictToSharesSetResult> SetAsync(
        ScopeContext scope,
        Guid architectureId,
        bool restrictToShares,
        bool confirmOptIn,
        Guid actorUserId,
        string actorOid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorOid);

        ArchitectureIdentityRecord? architecture = await _architectureIdentityRepository.GetByIdAsync(
            scope,
            architectureId,
            cancellationToken);

        if (architecture is null)
            return ArchitectureRestrictToSharesSetResult.ArchitectureNotFound();

        if (restrictToShares && actorUserId == Guid.Empty)
            return ArchitectureRestrictToSharesSetResult.ActorUserRequired();

        if (restrictToShares && !confirmOptIn)
            return ArchitectureRestrictToSharesSetResult.ConfirmationRequired();

        bool actorAdminShareInserted = false;

        if (restrictToShares)
        {
            int shareCount = await _shareRepository.CountByArchitectureIdAsync(scope, architectureId, cancellationToken);

            if (shareCount == 0)
            {
                DateTime grantedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

                await _shareRepository.UpsertAsync(
                    scope,
                    new ArchitectureShareRecord
                    {
                        ArchitectureId = architectureId,
                        ActorOid = actorOid.Trim(),
                        Role = ArchitectureShareRoles.Admin,
                        GrantedBy = actorOid.Trim(),
                        GrantedUtc = grantedUtc,
                    },
                    cancellationToken);

                actorAdminShareInserted = true;
            }
        }

        bool updated = await _architectureIdentityRepository.TrySetRestrictToSharesAsync(
            scope,
            architectureId,
            restrictToShares,
            cancellationToken);

        if (!updated)
            return ArchitectureRestrictToSharesSetResult.ArchitectureNotFound();

        return ArchitectureRestrictToSharesSetResult.Success(
            new ArchitectureRestrictToSharesResponse
            {
                ArchitectureId = architectureId,
                RestrictToShares = restrictToShares,
                ActorAdminShareInserted = actorAdminShareInserted,
            });
    }
}
