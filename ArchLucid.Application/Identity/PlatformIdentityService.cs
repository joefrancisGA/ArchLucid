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

public sealed class PlatformIdentityService(
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

    public async Task<PlatformUserRecord?> FindUserByExternalIdentityAsync(
        ExternalIdentityKey externalKey,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(externalKey);

        ExternalIdentityKey normalized = NormalizeExternalKey(externalKey);

        AuthenticationIdentityRecord? identity =
            await _identities.FindByExternalKeyAsync(normalized, cancellationToken).ConfigureAwait(false);

        if (identity is null)
        {
            return null;
        }

        return await _users.GetByIdAsync(identity.UserId, cancellationToken).ConfigureAwait(false);
    }

    public async Task<PlatformUserRecord?> FindUserByAnyExternalIdentityAsync(
        ExternalIdentityKey externalKey,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(externalKey);

        ExternalIdentityKey normalized = NormalizeExternalKey(externalKey);

        AuthenticationIdentityRecord? identity =
            await _identities.FindAnyByExternalKeyAsync(normalized, cancellationToken).ConfigureAwait(false);

        if (identity is null)
        {
            return null;
        }

        return await _users.GetByIdAsync(identity.UserId, cancellationToken).ConfigureAwait(false);
    }

    public Task<IReadOnlyList<AuthenticationIdentityRecord>> GetIdentitiesForUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return _identities.ListByUserIdAsync(userId, cancellationToken);
    }

    public async Task<PlatformUserRecord> CreateUserFromVerifiedIdentityAsync(
        VerifiedExternalIdentityCreateRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.ExternalKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ActorId);

        ValidateEmailTrustForAssociation(request);

        ExternalIdentityKey normalizedKey = NormalizeExternalKey(request.ExternalKey);

        AuthenticationIdentityRecord? existingIdentity =
            await _identities.FindAnyByExternalKeyAsync(normalizedKey, cancellationToken).ConfigureAwait(false);

        if (existingIdentity is not null)
        {
            throw new DuplicateAuthenticationIdentityException(normalizedKey);
        }

        string? normalizedEmail = null;
        string? displayEmail = null;

        if (!string.IsNullOrWhiteSpace(request.PrimaryContactEmail))
        {
            if (!IdentityEmailNormalizer.TryNormalize(request.PrimaryContactEmail, out normalizedEmail, out displayEmail))
            {
                throw new ArgumentException("Primary contact email is not a valid email address.", nameof(request));
            }
        }

        if (!string.IsNullOrWhiteSpace(request.DisplayEmail))
        {
            if (!IdentityEmailNormalizer.TryNormalize(request.DisplayEmail, out string identityNormalized, out string identityDisplay))
            {
                throw new ArgumentException("Display email is not a valid email address.", nameof(request));
            }

            normalizedEmail ??= identityNormalized;
            displayEmail ??= identityDisplay;
        }

        PlatformUserRecord user = await _users.InsertAsync(
            new PlatformUserInsert
            {
                PrimaryEmail = displayEmail,
                NormalizedPrimaryEmail = normalizedEmail,
                DisplayName = request.DisplayName,
                Status = PlatformUserStatus.Active
            },
            cancellationToken).ConfigureAwait(false);

        await InsertIdentityForUserAsync(
                user.Id,
                normalizedKey,
                request.EmailVerified ? normalizedEmail : null,
                request.EmailVerified ? displayEmail : null,
                request,
                cancellationToken)
            .ConfigureAwait(false);

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.PlatformUserCreated,
                request.ActorId,
                new
                {
                    userId = user.Id,
                    providerType = normalizedKey.ProviderType.ToString(),
                    subject = normalizedKey.Subject
                },
                cancellationToken,
                request.TenantIdForAudit)
            .ConfigureAwait(false);

        return user;
    }

    public async Task<AuthenticationIdentityRecord> AttachIdentityToExistingUserAsync(
        Guid userId,
        VerifiedExternalIdentityCreateRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.ExternalKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ActorId);

        ValidateEmailTrustForAssociation(request);

        PlatformUserRecord? user = await _users.GetByIdAsync(userId, cancellationToken).ConfigureAwait(false);

        if (user is null)
        {
            throw new PlatformUserNotFoundException(userId);
        }

        ExternalIdentityKey normalizedKey = NormalizeExternalKey(request.ExternalKey);

        await EnsureTenantIsolationForAttachmentAsync(userId, normalizedKey, cancellationToken).ConfigureAwait(false);

        AuthenticationIdentityRecord? existingIdentity =
            await _identities.FindAnyByExternalKeyAsync(normalizedKey, cancellationToken).ConfigureAwait(false);

        if (existingIdentity is not null)
        {
            if (existingIdentity.UserId == userId && existingIdentity.DisabledUtc is not null)
            {
                bool reEnabled = await _identities.ReEnableAsync(existingIdentity.Id, cancellationToken).ConfigureAwait(false);

                if (reEnabled)
                {
                    AuthenticationIdentityRecord? reloaded =
                        await _identities.GetByIdAsync(existingIdentity.Id, cancellationToken).ConfigureAwait(false);

                    if (reloaded is not null)
                    {
                        return reloaded;
                    }
                }
            }

            if (existingIdentity.UserId == userId && existingIdentity.DisabledUtc is null)
            {
                return existingIdentity;
            }

            throw new DuplicateAuthenticationIdentityException(normalizedKey);
        }

        string? normalizedEmail = null;
        string? displayEmail = null;

        if (!string.IsNullOrWhiteSpace(request.DisplayEmail))
        {
            if (!IdentityEmailNormalizer.TryNormalize(request.DisplayEmail, out normalizedEmail, out displayEmail))
            {
                throw new ArgumentException("Display email is not a valid email address.", nameof(request));
            }
        }

        AuthenticationIdentityRecord created = await InsertIdentityForUserAsync(
                userId,
                normalizedKey,
                request.EmailVerified ? normalizedEmail : null,
                request.EmailVerified ? displayEmail : null,
                request,
                cancellationToken)
            .ConfigureAwait(false);

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.AuthenticationIdentityAttached,
                request.ActorId,
                new
                {
                    userId,
                    identityId = created.Id,
                    providerType = normalizedKey.ProviderType.ToString(),
                    subject = normalizedKey.Subject
                },
                cancellationToken,
                request.TenantIdForAudit ?? normalizedKey.TenantId)
            .ConfigureAwait(false);

        return created;
    }

    public async Task DisableIdentityAsync(
        Guid identityId,
        string actorId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);

        AuthenticationIdentityRecord? target =
            await _identities.GetByIdAsync(identityId, cancellationToken).ConfigureAwait(false);

        if (target is null || target.DisabledUtc is not null)
        {
            return;
        }

        IReadOnlyList<AuthenticationIdentityRecord> userIdentities =
            await _identities.ListByUserIdAsync(target.UserId, cancellationToken).ConfigureAwait(false);

        int activeCount = userIdentities.Count(row => row.DisabledUtc is null);

        if (activeCount <= 1)
        {
            throw new FinalSignInMethodRemovalException();
        }

        DateTimeOffset disabledUtc = _timeProvider.GetUtcNow();

        await _identities.DisableAsync(identityId, disabledUtc, cancellationToken).ConfigureAwait(false);

        Guid nextAuthVersion = Guid.NewGuid();

        await _users.RotateAuthVersionAsync(target.UserId, nextAuthVersion, disabledUtc, cancellationToken)
            .ConfigureAwait(false);

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.AuthenticationIdentityDisabled,
                actorId,
                new { userId = target.UserId, identityId },
                cancellationToken,
                target.TenantId)
            .ConfigureAwait(false);
    }

    public Task<bool> HasValidSignInMethodAsync(Guid userId, CancellationToken cancellationToken)
    {
        return _identities.HasActiveIdentityAsync(userId, cancellationToken);
    }

    private async Task<AuthenticationIdentityRecord> InsertIdentityForUserAsync(
        Guid userId,
        ExternalIdentityKey normalizedKey,
        string? normalizedEmail,
        string? displayEmail,
        VerifiedExternalIdentityCreateRequest request,
        CancellationToken cancellationToken)
    {
        AuthenticationIdentityRecord created = await _identities.InsertAsync(
            new AuthenticationIdentityInsert
            {
                UserId = userId,
                ProviderType = normalizedKey.ProviderType,
                NormalizedIssuer = normalizedKey.NormalizedIssuer,
                Subject = normalizedKey.Subject,
                NormalizedEmail = normalizedEmail,
                DisplayEmail = displayEmail,
                EmailVerified = request.EmailVerified,
                TenantId = normalizedKey.TenantId,
                TenantIdentityProviderId = normalizedKey.TenantIdentityProviderId
            },
            cancellationToken).ConfigureAwait(false);

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.AuthenticationIdentityCreated,
                request.ActorId,
                new
                {
                    userId,
                    identityId = created.Id,
                    providerType = normalizedKey.ProviderType.ToString(),
                    subject = normalizedKey.Subject
                },
                cancellationToken,
                request.TenantIdForAudit ?? normalizedKey.TenantId)
            .ConfigureAwait(false);

        return created;
    }

    private async Task EnsureTenantIsolationForAttachmentAsync(
        Guid userId,
        ExternalIdentityKey normalizedKey,
        CancellationToken cancellationToken)
    {
        if (normalizedKey.TenantId is null)
        {
            return;
        }

        IReadOnlyList<WorkspaceMembershipRecord> tenantMemberships =
            await _memberships.ListByUserAndTenantAsync(userId, normalizedKey.TenantId.Value, cancellationToken)
                .ConfigureAwait(false);

        if (tenantMemberships.Count == 0)
        {
            throw new CrossTenantIdentityAttachmentException(
                "Cannot attach a tenant-scoped identity to a user without membership in that tenant.");
        }
    }

    private static ExternalIdentityKey NormalizeExternalKey(ExternalIdentityKey key)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key.Subject);

        return new ExternalIdentityKey
        {
            ProviderType = key.ProviderType,
            NormalizedIssuer = IdentityIssuerNormalizer.Normalize(key.NormalizedIssuer),
            Subject = key.Subject.Trim(),
            TenantId = key.TenantId,
            TenantIdentityProviderId = key.TenantIdentityProviderId
        };
    }

    private static void ValidateEmailTrustForAssociation(VerifiedExternalIdentityCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayEmail))
        {
            return;
        }

        if (!request.EmailVerified)
        {
            throw new UnverifiedEmailIdentityAssociationException();
        }
    }

}
