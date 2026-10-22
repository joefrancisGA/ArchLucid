using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed class TenantAuthDomainRecoveryAdminService(
    ITenantSignInEmailDomainRepository domains,
    ITenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins,
    TimeProvider timeProvider)
{
    private readonly ITenantSignInEmailDomainRepository _domains =
        domains ?? throw new ArgumentNullException(nameof(domains));

    private readonly ITenantSignInEmailDomainRecoveryAdminRepository _recoveryAdmins =
        recoveryAdmins ?? throw new ArgumentNullException(nameof(recoveryAdmins));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<TenantSignInEmailDomainRecoveryAdminRecord> AddRecoveryAdminAsync(
        Guid tenantId,
        string normalizedDomain,
        string recoveryAdminEmail,
        string actorId,
        CancellationToken cancellationToken)
    {
        TenantSignInEmailDomainRecord record = await TenantAuthDomainAdminSupport
            .RequireDomainAsync(_domains, tenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        if (record.VerificationStatus != AuthDomainVerificationStatus.Verified)
        {
            throw new InvalidOperationException("Recovery administrators can only be added for verified domains.");
        }

        if (!IdentityEmailNormalizer.TryNormalize(recoveryAdminEmail, out string normalizedEmail, out string displayEmail))
        {
            throw new ArgumentException("Enter a valid recovery administrator email.", nameof(recoveryAdminEmail));
        }

        if (!string.Equals(
                TenantAuthDomainAdminSupport.ExtractDomain(normalizedEmail),
                record.NormalizedDomain,
                StringComparison.Ordinal))
        {
            throw new ArgumentException("Recovery administrator email must use the configured domain.");
        }

        TenantSignInEmailDomainRecoveryAdminRecord row = new()
        {
            TenantId = tenantId,
            NormalizedDomain = normalizedDomain,
            NormalizedRecoveryAdminEmail = normalizedEmail,
            DisplayRecoveryAdminEmail = displayEmail,
            CreatedUtc = _timeProvider.GetUtcNow(),
            CreatedByActorId = actorId
        };

        await _recoveryAdmins.InsertAsync(row, cancellationToken).ConfigureAwait(false);

        return row;
    }

    public Task<IReadOnlyList<TenantSignInEmailDomainRecoveryAdminRecord>> ListRecoveryAdminsAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken) =>
        _recoveryAdmins.ListByDomainAsync(tenantId, normalizedDomain, cancellationToken);

    public Task RemoveRecoveryAdminAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedRecoveryAdminEmail,
        CancellationToken cancellationToken) =>
        TryRemoveRecoveryAdminAsync(tenantId, normalizedDomain, normalizedRecoveryAdminEmail, confirmRemoveLast: true, cancellationToken);

    public async Task<TenantAuthDomainRecoveryAdminRemovalResult> TryRemoveRecoveryAdminAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedRecoveryAdminEmail,
        bool confirmRemoveLast,
        CancellationToken cancellationToken)
    {
        TenantSignInEmailDomainRecord record = await TenantAuthDomainAdminSupport
            .RequireDomainAsync(_domains, tenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<TenantSignInEmailDomainRecoveryAdminRecord> recoveryRows =
            await _recoveryAdmins.ListByDomainAsync(tenantId, normalizedDomain, cancellationToken).ConfigureAwait(false);

        bool isLast = recoveryRows.Count == 1
            && string.Equals(
                recoveryRows[0].NormalizedRecoveryAdminEmail,
                normalizedRecoveryAdminEmail,
                StringComparison.Ordinal);

        if (isLast
            && record.EnforcementMode == AuthDomainEnforcementMode.SsoRequiredWithRecoveryException
            && record.IsEnforcementActive)
        {
            return new TenantAuthDomainRecoveryAdminRemovalResult
            {
                Removed = false,
                WasLastRecoveryAdmin = true,
                WarningMessage =
                    "Cannot remove the last recovery administrator while SSO enforcement is active. Add another recovery administrator first."
            };
        }

        await _recoveryAdmins
            .DeleteAsync(tenantId, normalizedDomain, normalizedRecoveryAdminEmail, cancellationToken)
            .ConfigureAwait(false);

        return new TenantAuthDomainRecoveryAdminRemovalResult
        {
            Removed = true,
            WasLastRecoveryAdmin = isLast,
            WarningMessage = isLast
                ? "Last recovery administrator removed. Tenant break-glass email access is no longer available."
                : null
        };
    }
}
