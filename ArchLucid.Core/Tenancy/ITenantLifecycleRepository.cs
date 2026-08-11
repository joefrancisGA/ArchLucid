namespace ArchLucid.Core.Tenancy;

/// <summary>Tenant row creation, suspension state, directory binding, and manual-prep baseline writes.</summary>
public interface ITenantLifecycleRepository
{
    Task InsertTenantAsync(
        Guid tenantId,
        string name,
        string slug,
        TenantTier tier,
        Guid? entraTenantId,
        string dataRegion,
        CancellationToken ct,
        int? enterpriseScimSeatsLimit = null);

    Task SuspendTenantAsync(Guid tenantId, CancellationToken ct);

    /// <summary>
    ///     Clears <c>SuspendedUtc</c> when the tenant is not in erasure quarantine.
    ///     Returns <see langword="false" /> when the tenant is missing or <c>OffboardedUtc</c> is set.
    /// </summary>
    Task<bool> TryUnsuspendTenantAsync(Guid tenantId, CancellationToken ct);

    /// <summary>Updates deferrable manual-prep baseline fields (settings page).</summary>
    Task UpdateBaselineAsync(
        Guid tenantId,
        decimal? manualPrepHoursPerReview,
        int? peoplePerReview,
        DateTimeOffset? capturedUtc,
        CancellationToken ct);

    /// <summary>
    ///     Binds <c>dbo.Tenants.EntraTenantId</c> to the corporate Entra directory (<c>tid</c>) for paid access.
    ///     No-op when the tenant is missing, when <paramref name="entraTenantId" /> is already held by another tenant,
    ///     or when this tenant is already bound to a different directory. Idempotent when the same value is supplied.
    /// </summary>
    /// <returns><c>true</c> when the directory id is now stored for this tenant; otherwise <c>false</c>.</returns>
    Task<bool> UpdateEntraTenantIdAsync(Guid tenantId, Guid entraTenantId, CancellationToken ct);
}
