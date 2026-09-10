using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

public sealed class ArchitectureShareService(
    IArchitectureIdentityRepository architectureIdentityRepository,
    IArchitectureShareRepository shareRepository) : IArchitectureShareService
{
    private readonly IArchitectureIdentityRepository _architectureIdentityRepository =
        architectureIdentityRepository ?? throw new ArgumentNullException(nameof(architectureIdentityRepository));

    private readonly IArchitectureShareRepository _shareRepository =
        shareRepository ?? throw new ArgumentNullException(nameof(shareRepository));

    public async Task<ArchitectureShareListResponse?> TryListSharesAsync(
        ScopeContext scope,
        Guid architectureId,
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
            return null;

        ArchitectureShareRecord? actorShare = await _shareRepository.TryGetAsync(
            scope,
            architectureId,
            actorOid,
            cancellationToken);

        if (!ArchitectureShareAccessEvaluator.CanView(architecture, actorShare))
            return null;

        if (!ArchitectureShareAccessEvaluator.CanAdmin(architecture, actorShare))
            return null;

        return await BuildListResponseAsync(scope, architecture, cancellationToken);
    }

    public async Task<ArchitectureShareMutationResult> PutShareAsync(
        ScopeContext scope,
        Guid architectureId,
        PutArchitectureShareRequest request,
        string actorDisplayName,
        string actorOid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorDisplayName);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorOid);

        if (!ArchitectureShareActorValidation.TryValidateUserActorOid(request.ActorOid, out string targetActorOid, out string? actorValidationReason))
            return ArchitectureShareMutationResult.ValidationFailed(actorValidationReason!);

        if (!ArchitectureShareRoles.IsKnownRole(request.Role))
            return ArchitectureShareMutationResult.ValidationFailed("Role must be View, Decide, or Admin.");

        ArchitectureIdentityRecord? architecture = await _architectureIdentityRepository.GetByIdAsync(
            scope,
            architectureId,
            cancellationToken);

        if (architecture is null)
            return ArchitectureShareMutationResult.ArchitectureNotFound();

        ArchitectureShareRecord? actorShare = await _shareRepository.TryGetAsync(
            scope,
            architectureId,
            actorOid,
            cancellationToken);

        if (!ArchitectureShareAccessEvaluator.CanAdmin(architecture, actorShare))
            return ArchitectureShareMutationResult.NotAuthorized();

        string normalizedRole = ArchitectureShareRoles.NormalizeRole(request.Role);
        DateTime grantedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        await _shareRepository.UpsertAsync(
            scope,
            new ArchitectureShareRecord
            {
                ArchitectureId = architectureId,
                ActorOid = targetActorOid,
                Role = normalizedRole,
                GrantedBy = actorDisplayName.Trim(),
                GrantedUtc = grantedUtc,
            },
            cancellationToken);

        ArchitectureShareListResponse response = await BuildListResponseAsync(scope, architecture, cancellationToken);

        return ArchitectureShareMutationResult.Success(response);
    }

    public async Task<ArchitectureShareMutationResult> RevokeShareAsync(
        ScopeContext scope,
        Guid architectureId,
        string targetActorOid,
        string actorDisplayName,
        string actorOid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorDisplayName);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorOid);

        if (!ArchitectureShareActorValidation.TryValidateUserActorOid(targetActorOid, out string normalizedTargetActorOid, out string? actorValidationReason))
            return ArchitectureShareMutationResult.ValidationFailed(actorValidationReason!);

        ArchitectureIdentityRecord? architecture = await _architectureIdentityRepository.GetByIdAsync(
            scope,
            architectureId,
            cancellationToken);

        if (architecture is null)
            return ArchitectureShareMutationResult.ArchitectureNotFound();

        ArchitectureShareRecord? actorShare = await _shareRepository.TryGetAsync(
            scope,
            architectureId,
            actorOid,
            cancellationToken);

        if (!ArchitectureShareAccessEvaluator.CanAdmin(architecture, actorShare))
            return ArchitectureShareMutationResult.NotAuthorized();

        await _shareRepository.TryDeleteAsync(scope, architectureId, normalizedTargetActorOid, cancellationToken);

        ArchitectureShareListResponse response = await BuildListResponseAsync(scope, architecture, cancellationToken);

        return ArchitectureShareMutationResult.Success(response);
    }

    public async Task<ArchitectureShareMutationResult> PatchRestrictToSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        PatchArchitectureRestrictToSharesRequest request,
        string actorDisplayName,
        string actorOid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorDisplayName);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorOid);

        ArchitectureIdentityRecord? architecture = await _architectureIdentityRepository.GetByIdAsync(
            scope,
            architectureId,
            cancellationToken);

        if (architecture is null)
            return ArchitectureShareMutationResult.ArchitectureNotFound();

        ArchitectureShareRecord? actorShare = await _shareRepository.TryGetAsync(
            scope,
            architectureId,
            actorOid,
            cancellationToken);

        if (!ArchitectureShareAccessEvaluator.CanAdmin(architecture, actorShare))
            return ArchitectureShareMutationResult.NotAuthorized();

        if (request.RestrictToShares && !request.ConfirmRestrict)
        {
            return ArchitectureShareMutationResult.ValidationFailed(
                "Confirm restrict-to-shares before hiding this architecture from unshared workspace members.");
        }

        if (request.RestrictToShares)
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
                        GrantedBy = actorDisplayName.Trim(),
                        GrantedUtc = grantedUtc,
                    },
                    cancellationToken);
            }
        }

        bool updated = await _architectureIdentityRepository.TrySetRestrictToSharesAsync(
            scope,
            architectureId,
            request.RestrictToShares,
            cancellationToken);

        if (!updated)
            return ArchitectureShareMutationResult.ArchitectureNotFound();

        architecture.RestrictToShares = request.RestrictToShares;

        ArchitectureShareListResponse response = await BuildListResponseAsync(scope, architecture, cancellationToken);

        return ArchitectureShareMutationResult.Success(response);
    }

    private async Task<ArchitectureShareListResponse> BuildListResponseAsync(
        ScopeContext scope,
        ArchitectureIdentityRecord architecture,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<ArchitectureShareRecord> shares = await _shareRepository.ListByArchitectureIdAsync(
            scope,
            architecture.ArchitectureId,
            cancellationToken);

        return new ArchitectureShareListResponse
        {
            ArchitectureId = architecture.ArchitectureId,
            RestrictToShares = architecture.RestrictToShares,
            Shares = shares
                .Select(share => new ArchitectureShareResponse
                {
                    ArchitectureId = share.ArchitectureId,
                    ActorOid = share.ActorOid,
                    Role = share.Role,
                    GrantedBy = share.GrantedBy,
                    GrantedUtc = share.GrantedUtc,
                    RowVersionBase64 = share.RowVersion is null ? null : Convert.ToBase64String(share.RowVersion),
                })
                .ToList(),
        };
    }
}
