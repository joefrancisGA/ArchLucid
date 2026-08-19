using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

/// <summary>
///     Reserves a trial seat for the authenticated principal on first use per tenant (idempotent per tenant + principal
///     key).
/// </summary>
public sealed class TrialSeatAccountant(
    ITenantGetByIdRequestCache tenantGetByIdRequestCache,
    ITenantRepository tenantRepository,
    ITenantTrialSeatSkipCache seatSkipCache)
{
    private readonly ITenantGetByIdRequestCache _tenantGetByIdRequestCache =
        tenantGetByIdRequestCache ?? throw new ArgumentNullException(nameof(tenantGetByIdRequestCache));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITenantTrialSeatSkipCache _seatSkipCache =
        seatSkipCache ?? throw new ArgumentNullException(nameof(seatSkipCache));

    /// <summary>
    ///     Attempts to claim a seat for <paramref name="principalKey" /> when the tenant is on a metered active trial.
    /// </summary>
    public async Task TryReserveSeatAsync(ScopeContext scope, string principalKey, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(principalKey);
        ArgumentNullException.ThrowIfNull(scope);

        if (scope.TenantId == Guid.Empty)
            return;

        if (string.IsNullOrWhiteSpace(principalKey))
            return;

        if (_seatSkipCache.IsSeatClaimNotRequired(scope.TenantId))
            return;

        TenantRecord? tenant = await _tenantGetByIdRequestCache
            .GetByIdAsync(scope.TenantId, cancellationToken);

        if (!TenantTrialSeatPolicy.RequiresSeatClaim(tenant))
        {
            _seatSkipCache.RememberSeatClaimNotRequired(scope.TenantId);

            return;
        }

        await _tenantRepository.TryClaimTrialSeatAsync(scope.TenantId, principalKey, cancellationToken);
    }
}
