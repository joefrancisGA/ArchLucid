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
        string grantedBy,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(grantedBy);

        if (!await ArchitectureExistsAsync(scope, architectureId, cancellationToken))
            return ArchitectureRestrictToSharesSetResult.ArchitectureNotFound();

        if (!restrictToShares)
        {
            bool disabled = await _shareRepository.TryDisableRestrictToSharesAsync(
                scope,
                architectureId,
                cancellationToken);

            if (!disabled)
                return ArchitectureRestrictToSharesSetResult.ArchitectureNotFound();

            return ArchitectureRestrictToSharesSetResult.Success(
                new ArchitectureRestrictToSharesResponse
                {
                    ArchitectureId = architectureId,
                    RestrictToShares = false,
                    ActorAdminShareInserted = false,
                });
        }

        if (!confirmOptIn)
            return ArchitectureRestrictToSharesSetResult.ConfirmationRequired();

        if (actorUserId == Guid.Empty)
            return ArchitectureRestrictToSharesSetResult.ActorUserRequired();

        int shareCount = await _shareRepository.CountSharesAsync(scope, architectureId, cancellationToken);
        bool actorAdminShareInserted = shareCount == 0;

        bool enabled = await _shareRepository.TryEnableRestrictToSharesAsync(
            scope,
            architectureId,
            actorUserId,
            grantedBy.Trim(),
            cancellationToken);

        if (!enabled)
            return ArchitectureRestrictToSharesSetResult.ArchitectureNotFound();

        return ArchitectureRestrictToSharesSetResult.Success(
            new ArchitectureRestrictToSharesResponse
            {
                ArchitectureId = architectureId,
                RestrictToShares = true,
                ActorAdminShareInserted = actorAdminShareInserted,
            });
    }

    private async Task<bool> ArchitectureExistsAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        ArchitectureIdentityRecord? identity = await _architectureIdentityRepository.GetByIdAsync(
            scope,
            architectureId,
            cancellationToken);

        return identity is not null;
    }
}
