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

public sealed partial class PlatformAuthRecoveryService(
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
