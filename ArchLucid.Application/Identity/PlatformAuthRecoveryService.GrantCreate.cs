using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed partial class PlatformAuthRecoveryService
{
    public async Task<PlatformAuthRecoveryGrantView> GrantTemporaryRecoveryAccessAsync(
        PlatformAuthRecoveryGrantRequest request,
        string operatorActorId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.TenantId == Guid.Empty)
        {
            throw new ArgumentException("TenantId is required.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.NormalizedDomain))
        {
            throw new ArgumentException("NormalizedDomain is required.", nameof(request));
        }

        string reason = request.Reason.Trim();

        if (reason.Length < 20)
        {
            throw new ArgumentException("Provide a detailed reason (at least 20 characters).", nameof(request));
        }

        string evidence = request.EvidenceReference.Trim();

        if (evidence.Length < 5)
        {
            throw new ArgumentException("Evidence reference is required.", nameof(request));
        }

        TenantSignInEmailDomainRecord? domain =
            await _domains.TryGetAsync(request.TenantId, request.NormalizedDomain, cancellationToken).ConfigureAwait(false)
            ?? throw new InvalidOperationException("Domain was not found for the tenant.");

        if (domain.VerificationStatus != AuthDomainVerificationStatus.Verified
            || !domain.IsEnforcementActive)
        {
            throw new InvalidOperationException("Platform recovery grants apply only to verified domains with active SSO enforcement.");
        }

        int durationHours = Math.Clamp(request.DurationHours, MinDurationHours, MaxDurationHours);
        DateTimeOffset now = _timeProvider.GetUtcNow();

        PlatformTenantAuthRecoveryGrantRecord? existing =
            await _grants.GetActiveByTenantAndDomainAsync(
                    request.TenantId,
                    request.NormalizedDomain,
                    now,
                    cancellationToken)
                .ConfigureAwait(false);

        if (existing is not null)
        {
            throw new InvalidOperationException("An active platform recovery grant already exists for this domain.");
        }

        PlatformTenantAuthRecoveryGrantRecord stored = await _grants.InsertAsync(
            new PlatformTenantAuthRecoveryGrantRecord
            {
                GrantId = Guid.NewGuid(),
                TenantId = request.TenantId,
                NormalizedDomain = request.NormalizedDomain,
                Reason = reason,
                EvidenceReference = evidence,
                GrantedByActorId = operatorActorId,
                GrantedUtc = now,
                ExpiresUtc = now.AddHours(durationHours)
            },
            cancellationToken).ConfigureAwait(false);

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.PlatformTenantAuthRecoveryGranted,
                operatorActorId,
                new
                {
                    grantId = stored.GrantId,
                    normalizedDomain = stored.NormalizedDomain,
                    expiresUtc = stored.ExpiresUtc,
                    evidenceReference = evidence
                },
                cancellationToken,
                request.TenantId)
            .ConfigureAwait(false);

        IReadOnlyList<TenantSignInEmailDomainRecoveryAdminRecord> recoveryRows =
            await _recoveryAdmins.ListByDomainAsync(request.TenantId, request.NormalizedDomain, cancellationToken)
                .ConfigureAwait(false);

        bool notified = await _notifications.TryNotifyTenantRecoveryGrantAsync(
                request.TenantId,
                request.NormalizedDomain,
                stored.ExpiresUtc,
                recoveryRows.Select(row => row.DisplayRecoveryAdminEmail).ToList(),
                cancellationToken)
            .ConfigureAwait(false);

        if (notified)
        {
            await _grants.MarkTenantNotifiedAsync(stored.GrantId, now, cancellationToken).ConfigureAwait(false);
        }

        return ToView(stored, now);
    }
}
