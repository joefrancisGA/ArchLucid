using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

public sealed class ArchitectureShareManagementService(
    IArchitectureIdentityRepository architectureIdentityRepository,
    IArchitectureShareRepository shareRepository,
    IArchitectureShareGrantTargetValidator grantTargetValidator) : IArchitectureShareManagementService
{
    private readonly IArchitectureIdentityRepository _architectureIdentityRepository =
        architectureIdentityRepository ?? throw new ArgumentNullException(nameof(architectureIdentityRepository));

    private readonly IArchitectureShareRepository _shareRepository =
        shareRepository ?? throw new ArgumentNullException(nameof(shareRepository));

    private readonly IArchitectureShareGrantTargetValidator _grantTargetValidator =
        grantTargetValidator ?? throw new ArgumentNullException(nameof(grantTargetValidator));

    public async Task<ArchitectureShareListResult> GetSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!await ArchitectureExistsAsync(scope, architectureId, cancellationToken))
            return ArchitectureShareListResult.ArchitectureNotFound();

        bool? restrictToShares = await _shareRepository.TryGetRestrictToSharesAsync(
            scope,
            architectureId,
            cancellationToken);

        if (restrictToShares is null)
            return ArchitectureShareListResult.ArchitectureNotFound();

        IReadOnlyList<ArchitectureShareRecord> shares = await _shareRepository.ListSharesAsync(
            scope,
            architectureId,
            cancellationToken);

        return ArchitectureShareListResult.Success(
            new ArchitectureShareListResponse
            {
                ArchitectureId = architectureId,
                RestrictToShares = restrictToShares.Value,
                Shares = shares
                    .Select(share => new ArchitectureShareGrantResponse
                    {
                        UserId = share.UserId,
                        Role = share.Role,
                        GrantedBy = share.GrantedBy,
                        GrantedUtc = share.GrantedUtc,
                    })
                    .ToList(),
            });
    }

    public async Task<ArchitectureShareUpsertResult> UpsertShareAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid userId,
        string role,
        string grantedBy,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(grantedBy);

        if (!IsValidRole(role))
            return ArchitectureShareUpsertResult.InvalidRole();

        if (!await ArchitectureExistsAsync(scope, architectureId, cancellationToken))
            return ArchitectureShareUpsertResult.ArchitectureNotFound();

        ArchitectureShareGrantTargetValidationResult grantTarget =
            await _grantTargetValidator.ValidateUserTargetAsync(scope, userId, cancellationToken);

        if (grantTarget.Status == ArchitectureShareGrantTargetValidationStatus.ScimGroupNotSupported)
            return ArchitectureShareUpsertResult.ScimGroupNotSupported();

        if (grantTarget.Status == ArchitectureShareGrantTargetValidationStatus.UserNotFound)
            return ArchitectureShareUpsertResult.UserNotFound();

        bool upserted = await _shareRepository.UpsertShareAsync(
            scope,
            architectureId,
            userId,
            role,
            grantedBy,
            cancellationToken);

        if (!upserted)
            return ArchitectureShareUpsertResult.ArchitectureNotFound();

        return ArchitectureShareUpsertResult.Success();
    }

    public async Task<ArchitectureShareDeleteResult> DeleteShareAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!await ArchitectureExistsAsync(scope, architectureId, cancellationToken))
            return ArchitectureShareDeleteResult.ArchitectureNotFound();

        bool deleted = await _shareRepository.TryDeleteShareAsync(
            scope,
            architectureId,
            userId,
            cancellationToken);

        if (!deleted)
            return ArchitectureShareDeleteResult.ShareNotFound();

        return ArchitectureShareDeleteResult.Success();
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

    private static bool IsValidRole(string role)
    {
        string trimmed = role.Trim();

        return trimmed is ArchitectureShareRoles.View
            or ArchitectureShareRoles.Decide
            or ArchitectureShareRoles.Admin;
    }
}
