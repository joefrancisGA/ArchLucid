using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed class TenantAuthDomainAdminService(
    ITenantSignInEmailDomainRepository domains,
    TimeProvider timeProvider,
    TenantAuthDomainVerificationService verification,
    TenantAuthDomainEnforcementService enforcement,
    TenantAuthDomainRecoveryAdminService recoveryAdmins)
{
    private readonly ITenantSignInEmailDomainRepository _domains =
        domains ?? throw new ArgumentNullException(nameof(domains));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly TenantAuthDomainVerificationService _verification =
        verification ?? throw new ArgumentNullException(nameof(verification));

    private readonly TenantAuthDomainEnforcementService _enforcement =
        enforcement ?? throw new ArgumentNullException(nameof(enforcement));

    private readonly TenantAuthDomainRecoveryAdminService _recoveryAdmins =
        recoveryAdmins ?? throw new ArgumentNullException(nameof(recoveryAdmins));

    public Task<IReadOnlyList<TenantSignInEmailDomainRecord>> ListDomainsAsync(
        Guid tenantId,
        CancellationToken cancellationToken) =>
        _domains.ListByTenantIdAsync(tenantId, cancellationToken);

    public Task<TenantSignInEmailDomainRecord> ProposeDomainAsync(
        Guid tenantId,
        string domainInput,
        CancellationToken cancellationToken) =>
        _verification.ProposeDomainAsync(tenantId, domainInput, cancellationToken);

    public Task<TenantSignInEmailDomainRecord> BeginVerificationAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken) =>
        _verification.BeginVerificationAsync(tenantId, normalizedDomain, cancellationToken);

    public Task<TenantSignInEmailDomainRecord> CheckVerificationAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken) =>
        _verification.CheckVerificationAsync(tenantId, normalizedDomain, cancellationToken);

    public Task<TenantSignInEmailDomainRecord> MarkRoutingTestPassedAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedTestEmail,
        CancellationToken cancellationToken) =>
        _verification.MarkRoutingTestPassedAsync(tenantId, normalizedDomain, normalizedTestEmail, cancellationToken);

    public Task<TenantSignInEmailDomainRecord> SetEnforcementModeAsync(
        Guid tenantId,
        string normalizedDomain,
        AuthDomainEnforcementMode enforcementMode,
        bool allowEmailOtpRecovery,
        CancellationToken cancellationToken) =>
        _enforcement.SetEnforcementModeAsync(
            tenantId,
            normalizedDomain,
            enforcementMode,
            allowEmailOtpRecovery,
            cancellationToken);

    public Task<TenantSignInEmailDomainRecord> EnableEnforcementAsync(
        Guid tenantId,
        string normalizedDomain,
        bool confirmTested,
        CancellationToken cancellationToken) =>
        _enforcement.EnableEnforcementAsync(tenantId, normalizedDomain, confirmTested, cancellationToken);

    public Task<TenantSignInEmailDomainRecoveryAdminRecord> AddRecoveryAdminAsync(
        Guid tenantId,
        string normalizedDomain,
        string recoveryAdminEmail,
        string actorId,
        CancellationToken cancellationToken) =>
        _recoveryAdmins.AddRecoveryAdminAsync(tenantId, normalizedDomain, recoveryAdminEmail, actorId, cancellationToken);

    public Task<IReadOnlyList<TenantSignInEmailDomainRecoveryAdminRecord>> ListRecoveryAdminsAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken) =>
        _recoveryAdmins.ListRecoveryAdminsAsync(tenantId, normalizedDomain, cancellationToken);

    public Task RemoveRecoveryAdminAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedRecoveryAdminEmail,
        CancellationToken cancellationToken) =>
        _recoveryAdmins.RemoveRecoveryAdminAsync(tenantId, normalizedDomain, normalizedRecoveryAdminEmail, cancellationToken);

    public Task<TenantAuthDomainRecoveryAdminRemovalResult> TryRemoveRecoveryAdminAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedRecoveryAdminEmail,
        bool confirmRemoveLast,
        CancellationToken cancellationToken) =>
        _recoveryAdmins.TryRemoveRecoveryAdminAsync(
            tenantId,
            normalizedDomain,
            normalizedRecoveryAdminEmail,
            confirmRemoveLast,
            cancellationToken);

    public Task<TenantAuthDomainEnforcementReadiness> GetEnforcementReadinessAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken) =>
        _enforcement.GetEnforcementReadinessAsync(tenantId, normalizedDomain, cancellationToken);

    public async Task<TenantSignInEmailDomainRecord> RemoveDomainAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        TenantSignInEmailDomainRecord record = await TenantAuthDomainAdminSupport
            .RequireDomainAsync(_domains, tenantId, normalizedDomain, cancellationToken)
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
}
