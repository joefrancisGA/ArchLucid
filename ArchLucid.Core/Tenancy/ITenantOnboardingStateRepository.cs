namespace ArchLucid.Core.Tenancy;

/// <summary>Persistence for <c>dbo.TenantOnboardingState</c> (first Core Pilot session completion).</summary>
public interface ITenantOnboardingStateRepository
{
    /// <summary>Returns true when this call transitioned the tenant from "not completed" to "completed".</summary>
    Task<bool> TryMarkFirstSessionCompletedAsync(Guid tenantId, CancellationToken cancellationToken);
}
