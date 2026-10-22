using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public interface IPlatformIdentityService
{
    Task<PlatformUserRecord?> FindUserByExternalIdentityAsync(
        ExternalIdentityKey externalKey,
        CancellationToken cancellationToken);

    Task<PlatformUserRecord?> FindUserByAnyExternalIdentityAsync(
        ExternalIdentityKey externalKey,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<AuthenticationIdentityRecord>> GetIdentitiesForUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<PlatformUserRecord> CreateUserFromVerifiedIdentityAsync(
        VerifiedExternalIdentityCreateRequest request,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityRecord> AttachIdentityToExistingUserAsync(
        Guid userId,
        VerifiedExternalIdentityCreateRequest request,
        CancellationToken cancellationToken);

    Task DisableIdentityAsync(
        Guid identityId,
        string actorId,
        CancellationToken cancellationToken);

    Task<bool> HasValidSignInMethodAsync(Guid userId, CancellationToken cancellationToken);
}

public sealed class VerifiedExternalIdentityCreateRequest
{
    public ExternalIdentityKey ExternalKey
    {
        get;
        init;
    } = null!;

    public string? DisplayEmail
    {
        get;
        init;
    }

    /// <summary>Contact email stored on the platform user without becoming an authentication key.</summary>
    public string? PrimaryContactEmail
    {
        get;
        init;
    }

    public bool EmailVerified
    {
        get;
        init;
    }

    public string? DisplayName
    {
        get;
        init;
    }

    public string ActorId
    {
        get;
        init;
    } = string.Empty;

    public Guid? TenantIdForAudit
    {
        get;
        init;
    }
}

public sealed partial class PlatformIdentityService(
    IPlatformUserRepository users,
    IAuthenticationIdentityRepository identities,
    IWorkspaceMembershipRepository memberships,
    IAuditService auditService,
    TimeProvider timeProvider) : IPlatformIdentityService
{
    private readonly IPlatformUserRepository _users =
        users ?? throw new ArgumentNullException(nameof(users));

    private readonly IAuthenticationIdentityRepository _identities =
        identities ?? throw new ArgumentNullException(nameof(identities));

    private readonly IWorkspaceMembershipRepository _memberships =
        memberships ?? throw new ArgumentNullException(nameof(memberships));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public Task<IReadOnlyList<AuthenticationIdentityRecord>> GetIdentitiesForUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return _identities.ListByUserIdAsync(userId, cancellationToken);
    }

    public Task<bool> HasValidSignInMethodAsync(Guid userId, CancellationToken cancellationToken)
    {
        return _identities.HasActiveIdentityAsync(userId, cancellationToken);
    }
}
