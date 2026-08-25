using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed class TenantAuthDomainVerificationService(
    ITenantSignInEmailDomainRepository domains,
    ITenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins,
    AuthDomainDnsVerificationService dnsVerification,
    IAuthSignInRoutingService routingService,
    TimeProvider timeProvider)
{
    private readonly ITenantSignInEmailDomainRepository _domains =
        domains ?? throw new ArgumentNullException(nameof(domains));

    private readonly ITenantSignInEmailDomainRecoveryAdminRepository _recoveryAdmins =
        recoveryAdmins ?? throw new ArgumentNullException(nameof(recoveryAdmins));

    private readonly AuthDomainDnsVerificationService _dnsVerification =
        dnsVerification ?? throw new ArgumentNullException(nameof(dnsVerification));

    private readonly IAuthSignInRoutingService _routingService =
        routingService ?? throw new ArgumentNullException(nameof(routingService));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

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
        TenantSignInEmailDomainRecord record = await TenantAuthDomainAdminSupport
            .RequireDomainAsync(_domains, tenantId, normalizedDomain, cancellationToken)
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
        TenantSignInEmailDomainRecord record = await TenantAuthDomainAdminSupport
            .RequireDomainAsync(_domains, tenantId, normalizedDomain, cancellationToken)
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
        TenantSignInEmailDomainRecord record = await TenantAuthDomainAdminSupport
            .RequireDomainAsync(_domains, tenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        if (record.VerificationStatus != AuthDomainVerificationStatus.Verified)
        {
            throw new InvalidOperationException("Routing tests require a verified domain.");
        }

        if (!IdentityEmailNormalizer.TryNormalize(normalizedTestEmail, out string normalized, out _))
        {
            throw new ArgumentException("Enter a valid test email address.", nameof(normalizedTestEmail));
        }

        if (!string.Equals(
                TenantAuthDomainAdminSupport.ExtractDomain(normalized),
                record.NormalizedDomain,
                StringComparison.Ordinal))
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
}
