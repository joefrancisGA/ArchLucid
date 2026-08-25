using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed class TenantAuthDomainEnforcementService(
    ITenantSignInEmailDomainRepository domains,
    ITenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins,
    ITenantIdentityProviderConfigurationRepository identityProviders,
    IPlatformTenantAuthRecoveryGrantRepository platformRecoveryGrants,
    IWorkspaceMembershipRepository memberships,
    TimeProvider timeProvider)
{
    private readonly ITenantSignInEmailDomainRepository _domains =
        domains ?? throw new ArgumentNullException(nameof(domains));

    private readonly ITenantSignInEmailDomainRecoveryAdminRepository _recoveryAdmins =
        recoveryAdmins ?? throw new ArgumentNullException(nameof(recoveryAdmins));

    private readonly ITenantIdentityProviderConfigurationRepository _identityProviders =
        identityProviders ?? throw new ArgumentNullException(nameof(identityProviders));

    private readonly IPlatformTenantAuthRecoveryGrantRepository _platformRecoveryGrants =
        platformRecoveryGrants ?? throw new ArgumentNullException(nameof(platformRecoveryGrants));

    private readonly IWorkspaceMembershipRepository _memberships =
        memberships ?? throw new ArgumentNullException(nameof(memberships));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<TenantSignInEmailDomainRecord> SetEnforcementModeAsync(
        Guid tenantId,
        string normalizedDomain,
        AuthDomainEnforcementMode enforcementMode,
        bool allowEmailOtpRecovery,
        CancellationToken cancellationToken)
    {
        TenantSignInEmailDomainRecord record = await TenantAuthDomainAdminSupport
            .RequireDomainAsync(_domains, tenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        if (record.VerificationStatus != AuthDomainVerificationStatus.Verified)
        {
            throw new InvalidOperationException("Enforcement mode can only be changed after domain verification.");
        }

        bool requireSso = enforcementMode != AuthDomainEnforcementMode.SsoOptional;
        bool recoveryAllowed = enforcementMode == AuthDomainEnforcementMode.SsoRequiredWithRecoveryException
            && allowEmailOtpRecovery;

        TenantSignInEmailDomainRecord updated = record with
        {
            EnforcementMode = enforcementMode,
            RequireEnterpriseSso = requireSso,
            AllowEmailOtpRecovery = recoveryAllowed,
            UpdatedUtc = _timeProvider.GetUtcNow(),
            EnforcementEnabledUtc = requireSso ? record.EnforcementEnabledUtc : null,
            RoutingTestPassedUtc = requireSso ? record.RoutingTestPassedUtc : null
        };

        await _domains.UpdateAsync(updated, cancellationToken).ConfigureAwait(false);

        return updated;
    }

    public async Task<TenantSignInEmailDomainRecord> EnableEnforcementAsync(
        Guid tenantId,
        string normalizedDomain,
        bool confirmTested,
        CancellationToken cancellationToken)
    {
        if (!confirmTested)
        {
            throw new ArgumentException("Confirm that SSO and recovery access were tested before enabling enforcement.");
        }

        TenantSignInEmailDomainRecord record = await TenantAuthDomainAdminSupport
            .RequireDomainAsync(_domains, tenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        if (record.VerificationStatus != AuthDomainVerificationStatus.Verified)
        {
            throw new InvalidOperationException("Domain ownership must be verified before enforcement.");
        }

        if (record.EnforcementMode == AuthDomainEnforcementMode.SsoOptional)
        {
            throw new InvalidOperationException("Choose an enforcement mode that requires SSO before enabling enforcement.");
        }

        if (!record.RoutingTestPassedUtc.HasValue)
        {
            throw new InvalidOperationException("Run a successful routing test before enabling enforcement.");
        }

        TenantIdentityProviderConfigurationRecord? idp =
            await _identityProviders.TryGetAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (idp is null || !idp.IsActive)
        {
            throw new InvalidOperationException("Activate a tenant identity provider before enabling SSO enforcement.");
        }

        if (record.EnforcementMode == AuthDomainEnforcementMode.SsoRequiredWithRecoveryException
            && record.AllowEmailOtpRecovery)
        {
            IReadOnlyList<TenantSignInEmailDomainRecoveryAdminRecord> recoveryRows =
                await _recoveryAdmins.ListByDomainAsync(tenantId, normalizedDomain, cancellationToken)
                    .ConfigureAwait(false);

            if (recoveryRows.Count == 0)
            {
                throw new InvalidOperationException(
                    "Add at least one recovery administrator before enabling recovery exceptions.");
            }

            bool allVerified = recoveryRows.All(row => row.AuthenticationVerifiedUtc.HasValue);

            if (!allVerified)
            {
                throw new InvalidOperationException(
                    "Verify recovery administrator sign-in with a routing test before enabling enforcement.");
            }
        }

        if (record.EnforcementMode == AuthDomainEnforcementMode.SsoRequiredForVerifiedDomain)
        {
            throw new InvalidOperationException(
                "SSO-only enforcement has no tenant recovery path. Switch to SSO with recovery administrators or confirm platform-assisted recovery before enabling.");
        }

        TenantSignInEmailDomainRecord updated = record with
        {
            EnforcementEnabledUtc = _timeProvider.GetUtcNow(),
            RequireEnterpriseSso = true,
            UpdatedUtc = _timeProvider.GetUtcNow()
        };

        await _domains.UpdateAsync(updated, cancellationToken).ConfigureAwait(false);

        return updated;
    }

    public async Task<TenantAuthDomainEnforcementReadiness> GetEnforcementReadinessAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        TenantSignInEmailDomainRecord record = await TenantAuthDomainAdminSupport
            .RequireDomainAsync(_domains, tenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        TenantIdentityProviderConfigurationRecord? idp =
            await _identityProviders.TryGetAsync(tenantId, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<TenantSignInEmailDomainRecoveryAdminRecord> recoveryRows =
            await _recoveryAdmins.ListByDomainAsync(tenantId, normalizedDomain, cancellationToken).ConfigureAwait(false);

        int ownerCount = await _memberships.CountActivePrivilegedMembersByTenantAsync(tenantId, cancellationToken)
            .ConfigureAwait(false);

        DateTimeOffset now = _timeProvider.GetUtcNow();
        PlatformTenantAuthRecoveryGrantRecord? platformGrant =
            await _platformRecoveryGrants
                .GetActiveByTenantAndDomainAsync(tenantId, normalizedDomain, now, cancellationToken)
                .ConfigureAwait(false);

        bool identityProviderConfigured = idp is not null && idp.IsActive;
        bool domainVerified = record.VerificationStatus == AuthDomainVerificationStatus.Verified;
        bool testSignInCompleted = record.RoutingTestPassedUtc.HasValue;
        bool recoveryAdminsPresent = recoveryRows.Count > 0;
        bool recoveryAdminsVerified = recoveryRows.Count > 0
            && recoveryRows.All(row => row.AuthenticationVerifiedUtc.HasValue);
        bool twoOwnersRecommended = ownerCount >= 2;

        bool requiresRecoveryPath = record.EnforcementMode != AuthDomainEnforcementMode.SsoOptional;
        bool hasRecoveryRoute = record.EnforcementMode == AuthDomainEnforcementMode.SsoRequiredWithRecoveryException
            ? recoveryAdminsPresent && recoveryAdminsVerified
            : platformGrant is not null;

        List<TenantAuthDomainEnforcementChecklistItem> checklist =
        [
            new()
            {
                Key = "identity_provider_configured",
                Label = "Identity provider configured",
                Complete = identityProviderConfigured,
                Required = true
            },
            new()
            {
                Key = "test_sign_in_completed",
                Label = "Test sign-in completed",
                Complete = testSignInCompleted,
                Required = true
            },
            new()
            {
                Key = "domain_verified",
                Label = "Domain verified",
                Complete = domainVerified,
                Required = true
            },
            new()
            {
                Key = "recovery_administrator_confirmed",
                Label = "Recovery administrator confirmed",
                Complete = record.EnforcementMode == AuthDomainEnforcementMode.SsoRequiredWithRecoveryException
                    ? recoveryAdminsVerified
                    : true,
                Required = record.EnforcementMode == AuthDomainEnforcementMode.SsoRequiredWithRecoveryException,
                Detail = record.EnforcementMode == AuthDomainEnforcementMode.SsoRequiredWithRecoveryException
                    ? "Each recovery administrator must pass a routing test."
                    : "Not required for SSO-only enforcement."
            },
            new()
            {
                Key = "two_tenant_owners_recommended",
                Label = "At least two tenant owners recommended",
                Complete = twoOwnersRecommended,
                Required = false,
                Detail = $"Active workspace admins/owners: {ownerCount}."
            }
        ];

        bool checklistComplete = checklist.Where(item => item.Required).All(item => item.Complete);
        bool blockEnforcement = requiresRecoveryPath && !hasRecoveryRoute;
        string? blockReason = blockEnforcement
            ? record.EnforcementMode == AuthDomainEnforcementMode.SsoRequiredWithRecoveryException
                ? "Add and verify at least one recovery administrator before enabling SSO enforcement."
                : "SSO-only enforcement has no tenant recovery path. Use SSO with recovery administrators or request platform-assisted recovery."
            : null;

        return new TenantAuthDomainEnforcementReadiness
        {
            CanEnableEnforcement = checklistComplete && !blockEnforcement,
            HasRecoveryRoute = hasRecoveryRoute,
            BlockEnforcement = blockEnforcement,
            BlockReason = blockReason,
            Checklist = checklist
        };
    }
}
