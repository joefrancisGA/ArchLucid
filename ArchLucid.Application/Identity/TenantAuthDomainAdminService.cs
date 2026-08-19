using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed class TenantAuthDomainAdminService(
    ITenantSignInEmailDomainRepository domains,
    ITenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins,
    ITenantIdentityProviderConfigurationRepository identityProviders,
    IPlatformTenantAuthRecoveryGrantRepository platformRecoveryGrants,
    IWorkspaceMembershipRepository memberships,
    AuthDomainDnsVerificationService dnsVerification,
    IAuthSignInRoutingService routingService,
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

    private readonly AuthDomainDnsVerificationService _dnsVerification =
        dnsVerification ?? throw new ArgumentNullException(nameof(dnsVerification));

    private readonly IAuthSignInRoutingService _routingService =
        routingService ?? throw new ArgumentNullException(nameof(routingService));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public Task<IReadOnlyList<TenantSignInEmailDomainRecord>> ListDomainsAsync(
        Guid tenantId,
        CancellationToken cancellationToken) =>
        _domains.ListByTenantIdAsync(tenantId, cancellationToken);

    public async Task<TenantSignInEmailDomainRecord> ProposeDomainAsync(
        Guid tenantId,
        string domainInput,
        CancellationToken cancellationToken)
    {
        if (!AuthEmailDomainNormalizer.TryNormalize(domainInput, out string normalizedDomain, out string displayDomain))
        {
            throw new ArgumentException("Enter a valid domain name.", nameof(domainInput));
        }

        TenantSignInEmailDomainRecord? existing =
            await _domains.FindByNormalizedDomainAsync(normalizedDomain, cancellationToken).ConfigureAwait(false);

        if (existing is not null && existing.VerificationStatus != AuthDomainVerificationStatus.Removed)
        {
            throw new InvalidOperationException("This domain is already registered.");
        }

        DateTimeOffset now = _timeProvider.GetUtcNow();
        string token = Guid.NewGuid().ToString("N");

        TenantSignInEmailDomainRecord record = new()
        {
            TenantId = tenantId,
            DisplayDomain = displayDomain,
            NormalizedDomain = normalizedDomain,
            VerificationStatus = AuthDomainVerificationStatus.Unverified,
            EnforcementMode = AuthDomainEnforcementMode.SsoOptional,
            DnsVerificationToken = token,
            RequireEnterpriseSso = false,
            AllowEmailOtpRecovery = false,
            CreatedUtc = now,
            UpdatedUtc = now
        };

        await _domains.InsertAsync(record, cancellationToken).ConfigureAwait(false);

        return record;
    }

    public async Task<TenantSignInEmailDomainRecord> BeginVerificationAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        TenantSignInEmailDomainRecord record = await RequireDomainAsync(tenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        TenantSignInEmailDomainRecord updated =
            await _dnsVerification.BeginVerificationAsync(record, cancellationToken).ConfigureAwait(false);

        await _domains.UpdateAsync(updated, cancellationToken).ConfigureAwait(false);

        return updated;
    }

    public async Task<TenantSignInEmailDomainRecord> CheckVerificationAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        TenantSignInEmailDomainRecord record = await RequireDomainAsync(tenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        TenantSignInEmailDomainRecord updated =
            await _dnsVerification.CheckVerificationAsync(record, cancellationToken).ConfigureAwait(false);

        await _domains.UpdateAsync(updated, cancellationToken).ConfigureAwait(false);

        return updated;
    }

    public async Task<TenantSignInEmailDomainRecord> MarkRoutingTestPassedAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedTestEmail,
        CancellationToken cancellationToken)
    {
        TenantSignInEmailDomainRecord record = await RequireDomainAsync(tenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        if (record.VerificationStatus != AuthDomainVerificationStatus.Verified)
        {
            throw new InvalidOperationException("Routing tests require a verified domain.");
        }

        if (!IdentityEmailNormalizer.TryNormalize(normalizedTestEmail, out string normalized, out _))
        {
            throw new ArgumentException("Enter a valid test email address.", nameof(normalizedTestEmail));
        }

        if (!string.Equals(ExtractDomain(normalized), record.NormalizedDomain, StringComparison.Ordinal))
        {
            throw new ArgumentException("Test email must use the configured domain.", nameof(normalizedTestEmail));
        }

        AuthSignInRoutingEvaluation evaluation = await _routingService.EvaluateEnforcementPreviewAsync(
            new AuthSignInRoutingRequest { NormalizedEmail = normalized },
            tenantId,
            normalizedDomain,
            cancellationToken).ConfigureAwait(false);

        if (record.EnforcementMode != AuthDomainEnforcementMode.SsoOptional
            && !evaluation.SsoRequired)
        {
            throw new InvalidOperationException(
                "Routing test did not detect SSO enforcement. Verify the identity provider and test email.");
        }

        DateTimeOffset now = _timeProvider.GetUtcNow();
        TenantSignInEmailDomainRecord updated = record with
        {
            RoutingTestPassedUtc = now,
            UpdatedUtc = now
        };

        await _domains.UpdateAsync(updated, cancellationToken).ConfigureAwait(false);

        if (await _recoveryAdmins
                .IsRecoveryAdminAsync(tenantId, normalizedDomain, normalized, cancellationToken)
                .ConfigureAwait(false))
        {
            await _recoveryAdmins.MarkAuthenticationVerifiedAsync(
                    tenantId,
                    normalizedDomain,
                    normalized,
                    now,
                    cancellationToken)
                .ConfigureAwait(false);
        }

        return updated;
    }

    public async Task<TenantSignInEmailDomainRecord> SetEnforcementModeAsync(
        Guid tenantId,
        string normalizedDomain,
        AuthDomainEnforcementMode enforcementMode,
        bool allowEmailOtpRecovery,
        CancellationToken cancellationToken)
    {
        TenantSignInEmailDomainRecord record = await RequireDomainAsync(tenantId, normalizedDomain, cancellationToken)
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

        TenantSignInEmailDomainRecord record = await RequireDomainAsync(tenantId, normalizedDomain, cancellationToken)
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

    public async Task<TenantSignInEmailDomainRecoveryAdminRecord> AddRecoveryAdminAsync(
        Guid tenantId,
        string normalizedDomain,
        string recoveryAdminEmail,
        string actorId,
        CancellationToken cancellationToken)
    {
        TenantSignInEmailDomainRecord record = await RequireDomainAsync(tenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        if (record.VerificationStatus != AuthDomainVerificationStatus.Verified)
        {
            throw new InvalidOperationException("Recovery administrators can only be added for verified domains.");
        }

        if (!IdentityEmailNormalizer.TryNormalize(recoveryAdminEmail, out string normalizedEmail, out string displayEmail))
        {
            throw new ArgumentException("Enter a valid recovery administrator email.", nameof(recoveryAdminEmail));
        }

        if (!string.Equals(ExtractDomain(normalizedEmail), record.NormalizedDomain, StringComparison.Ordinal))
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
        TenantSignInEmailDomainRecord record = await RequireDomainAsync(tenantId, normalizedDomain, cancellationToken)
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

    public async Task<TenantAuthDomainEnforcementReadiness> GetEnforcementReadinessAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        TenantSignInEmailDomainRecord record = await RequireDomainAsync(tenantId, normalizedDomain, cancellationToken)
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

    public async Task<TenantSignInEmailDomainRecord> RemoveDomainAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        TenantSignInEmailDomainRecord record = await RequireDomainAsync(tenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        DateTimeOffset now = _timeProvider.GetUtcNow();
        TenantSignInEmailDomainRecord updated = record with
        {
            VerificationStatus = AuthDomainVerificationStatus.Removed,
            RemovedUtc = now,
            UpdatedUtc = now,
            EnforcementEnabledUtc = null,
            RequireEnterpriseSso = false
        };

        await _domains.UpdateAsync(updated, cancellationToken).ConfigureAwait(false);

        return updated;
    }

    public string BuildDnsVerificationInstruction(TenantSignInEmailDomainRecord record)
    {
        if (string.IsNullOrWhiteSpace(record.DnsVerificationToken))
        {
            throw new InvalidOperationException("Domain verification token is missing.");
        }

        return $"Add a TXT record on {record.DisplayDomain} with value {AuthEmailDomainNormalizer.BuildDnsVerificationRecordValue(record.DnsVerificationToken)}";
    }

    private async Task<TenantSignInEmailDomainRecord> RequireDomainAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        TenantSignInEmailDomainRecord? record =
            await _domains.TryGetAsync(tenantId, normalizedDomain, cancellationToken).ConfigureAwait(false)
            ?? throw new InvalidOperationException("Domain was not found for this tenant.");

        return record;
    }

    private static string? ExtractDomain(string normalizedEmail)
    {
        int at = normalizedEmail.LastIndexOf('@');

        if (at < 0 || at >= normalizedEmail.Length - 1)
        {
            return null;
        }

        return normalizedEmail[(at + 1)..];
    }
}
