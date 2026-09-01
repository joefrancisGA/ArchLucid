using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Tenancy;

namespace ArchLucid.Application.Authorization;

/// <inheritdoc cref="IWorkOwnershipDeleteAuthorizationService" />
public sealed class WorkOwnershipDeleteAuthorizationService(
    IActorContext actorContext,
    ICallerRoleAccessor callerRoleAccessor,
    ITenantWorkOwnershipDeletePolicyService policyService) : IWorkOwnershipDeleteAuthorizationService
{
    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly ICallerRoleAccessor _callerRoleAccessor =
        callerRoleAccessor ?? throw new ArgumentNullException(nameof(callerRoleAccessor));

    private readonly ITenantWorkOwnershipDeletePolicyService _policyService =
        policyService ?? throw new ArgumentNullException(nameof(policyService));

    /// <inheritdoc />
    public async Task EnsureCanDeleteOwnedWorkAsync(string? createdByUserId, CancellationToken cancellationToken)
    {
        if (_callerRoleAccessor.IsTenantAdministrator())
            return;

        if (string.IsNullOrWhiteSpace(createdByUserId))
            return;

        bool allowCreatorDelete = await _policyService
            .GetAllowCreatorDeleteOwnedWorkAsync(cancellationToken)
            .ConfigureAwait(false);

        if (!allowCreatorDelete)
        {
            throw new WorkOwnershipDeleteForbiddenException(
                "Workspace administrators disabled creator delete for this tenant. Ask an administrator to remove this item.");
        }

        if (!IsCreator(createdByUserId))
        {
            throw new WorkOwnershipDeleteForbiddenException();
        }
    }

    private bool IsCreator(string createdByUserId)
    {
        IReadOnlyList<string> identities =
            ArchitectureRiskRegisterAssignedToMeIdentityResolver.Resolve(_actorContext);

        return identities.Any(identity =>
            string.Equals(identity, createdByUserId.Trim(), StringComparison.OrdinalIgnoreCase));
    }
}
