namespace ArchLucid.Application.Tenancy;

public interface ITenantWorkOwnershipDeletePolicyService
{
    /// <summary>When true (default), creators may delete or archive their own unsealed work.</summary>
    Task<bool> GetAllowCreatorDeleteOwnedWorkAsync(CancellationToken cancellationToken);

    Task<bool> SetAllowCreatorDeleteOwnedWorkAsync(bool allowCreatorDeleteOwnedWork, CancellationToken cancellationToken);
}
