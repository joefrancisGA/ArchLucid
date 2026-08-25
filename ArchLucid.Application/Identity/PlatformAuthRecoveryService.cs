using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed class PlatformAuthRecoveryGrantRequest
{
    public Guid TenantId
    {
        get;
        init;
    }

    public string NormalizedDomain
    {
        get;
        init;
    } = string.Empty;

    public string Reason
    {
        get;
        init;
    } = string.Empty;

    public string EvidenceReference
    {
        get;
        init;
    } = string.Empty;

    public int DurationHours
    {
        get;
        init;
    } = 4;
}

public sealed class PlatformAuthRecoveryGrantView
{
    public Guid GrantId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string NormalizedDomain
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset ExpiresUtc
    {
        get;
        init;
    }

    public bool IsActive
    {
        get;
        init;
    }
}

public interface IPlatformAuthRecoveryService
{
    Task<PlatformAuthRecoveryGrantView> GrantTemporaryRecoveryAccessAsync(
        PlatformAuthRecoveryGrantRequest request,
        string operatorActorId,
        CancellationToken cancellationToken);

    Task<bool> RevokeGrantAsync(Guid grantId, string operatorActorId, CancellationToken cancellationToken);

    Task<PlatformAuthRecoveryGrantView?> GetGrantAsync(Guid grantId, CancellationToken cancellationToken);
}

public sealed class PlatformAuthRecoveryService(
    IPlatformTenantAuthRecoveryGrantRepository grants,
    ITenantSignInEmailDomainRepository domains,
    ITenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins,
    IPlatformRecoveryNotificationService notifications,
    IAuditService auditService,
    TimeProvider timeProvider) : IPlatformAuthRecoveryService
{
    private const int MinDurationHours = 1;
    private const int MaxDurationHours = 24;

    private readonly IPlatformTenantAuthRecoveryGrantRepository _grants =
        grants ?? throw new ArgumentNullException(nameof(grants));

    private readonly ITenantSignInEmailDomainRepository _domains =
        domains ?? throw new ArgumentNullException(nameof(domains));

    private readonly ITenantSignInEmailDomainRecoveryAdminRepository _recoveryAdmins =
        recoveryAdmins ?? throw new ArgumentNullException(nameof(recoveryAdmins));

    private readonly IPlatformRecoveryNotificationService _notifications =
        notifications ?? throw new ArgumentNullException(nameof(notifications));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

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

    public async Task<bool> RevokeGrantAsync(Guid grantId, string operatorActorId, CancellationToken cancellationToken)
    {
        DateTimeOffset now = _timeProvider.GetUtcNow();
        bool revoked = await _grants.RevokeAsync(grantId, operatorActorId, now, cancellationToken).ConfigureAwait(false);

        if (!revoked)
        {
            return false;
        }

        PlatformTenantAuthRecoveryGrantRecord? grant =
            await _grants.GetByIdAsync(grantId, cancellationToken).ConfigureAwait(false);

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.PlatformTenantAuthRecoveryRevoked,
                operatorActorId,
                new { grantId },
                cancellationToken,
                grant?.TenantId)
            .ConfigureAwait(false);

        return true;
    }

    public async Task<PlatformAuthRecoveryGrantView?> GetGrantAsync(Guid grantId, CancellationToken cancellationToken)
    {
        PlatformTenantAuthRecoveryGrantRecord? grant =
            await _grants.GetByIdAsync(grantId, cancellationToken).ConfigureAwait(false);

        return grant is null ? null : ToView(grant, _timeProvider.GetUtcNow());
    }

    private static PlatformAuthRecoveryGrantView ToView(PlatformTenantAuthRecoveryGrantRecord grant, DateTimeOffset now) =>
        new()
        {
            GrantId = grant.GrantId,
            TenantId = grant.TenantId,
            NormalizedDomain = grant.NormalizedDomain,
            ExpiresUtc = grant.ExpiresUtc,
            IsActive = grant.IsActive(now)
        };
}

public interface IPlatformRecoveryNotificationService
{
    Task<bool> TryNotifyTenantRecoveryGrantAsync(
        Guid tenantId,
        string normalizedDomain,
        DateTimeOffset expiresUtc,
        IReadOnlyList<string> recoveryAdminEmails,
        CancellationToken cancellationToken);
}

public sealed class PlatformRecoveryNotificationService(IAuditService auditService) : IPlatformRecoveryNotificationService
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    public async Task<bool> TryNotifyTenantRecoveryGrantAsync(
        Guid tenantId,
        string normalizedDomain,
        DateTimeOffset expiresUtc,
        IReadOnlyList<string> recoveryAdminEmails,
        CancellationToken cancellationToken)
    {
        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.PlatformTenantAuthRecoveryTenantNotified,
                "platform",
                new
                {
                    normalizedDomain,
                    expiresUtc,
                    recipientCount = recoveryAdminEmails.Count
                },
                cancellationToken,
                tenantId)
            .ConfigureAwait(false);

        return true;
    }
}
