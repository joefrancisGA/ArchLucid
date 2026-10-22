using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed partial class PlatformIdentityService
{
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
}
