namespace ArchLucid.Application.Tenancy;

/// <summary>
///     Remembers tenants that do not require trial seat claims so middleware can skip trial-seat SQL on steady-state traffic.
/// </summary>
public interface ITenantTrialSeatSkipCache
{
    /// <summary><c>true</c> when a recent lookup showed seat claim is not required for <paramref name="tenantId" />.</summary>
    bool IsSeatClaimNotRequired(Guid tenantId);

    /// <summary>Caches that <paramref name="tenantId" /> does not require seat claim attempts.</summary>
    void RememberSeatClaimNotRequired(Guid tenantId);
}
