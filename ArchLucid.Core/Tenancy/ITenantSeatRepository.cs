namespace ArchLucid.Core.Tenancy;

/// <summary>Enterprise SCIM seat accounting on <c>dbo.Tenants</c>.</summary>
public interface ITenantSeatRepository
{
    /// <summary>
    ///     Increments <c>EnterpriseSeatsUsed</c> when a SCIM user becomes <c>Active=true</c> and the tenant has a finite
    ///     <c>EnterpriseSeatsLimit</c>.
    /// </summary>
    /// <returns><c>true</c> when the row was incremented; <c>false</c> when at limit.</returns>
    Task<bool> TryIncrementEnterpriseScimSeatAsync(Guid tenantId, CancellationToken ct);

    /// <summary>Decrements <c>EnterpriseSeatsUsed</c> after a SCIM user transitions from active to inactive.</summary>
    Task DecrementEnterpriseScimSeatAsync(Guid tenantId, CancellationToken ct);
}
