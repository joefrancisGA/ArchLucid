using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

/// <summary>
///     Shared authentication identity mapping, external-key storage, and lifecycle transitions for SQL and in-memory stores.
/// </summary>
internal static class AuthenticationIdentityRepositoryCore
{
    public static string BuildStorageKey(ExternalIdentityKey key) =>
        $"{AuthenticationProviderTypeMapper.ToStorageString(key.ProviderType)}|{key.NormalizedIssuer}|{key.Subject}|{AuthenticationProviderTypeMapper.BuildIdentityScopeKey(key.TenantId, key.TenantIdentityProviderId)}";

    public static ExternalIdentityKey ToExternalKey(AuthenticationIdentityRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        return new ExternalIdentityKey
        {
            ProviderType = record.ProviderType,
            NormalizedIssuer = record.NormalizedIssuer,
            Subject = record.Subject,
            TenantId = record.TenantId,
            TenantIdentityProviderId = record.TenantIdentityProviderId,
        };
    }

    public static AuthenticationIdentityRecord CreateFromInsert(AuthenticationIdentityInsert insert, DateTimeOffset createdUtc)
    {
        ArgumentNullException.ThrowIfNull(insert);

        return new AuthenticationIdentityRecord
        {
            Id = insert.Id != Guid.Empty ? insert.Id : Guid.NewGuid(),
            UserId = insert.UserId,
            ProviderType = insert.ProviderType,
            NormalizedIssuer = insert.NormalizedIssuer,
            Subject = insert.Subject,
            NormalizedEmail = insert.NormalizedEmail,
            DisplayEmail = insert.DisplayEmail,
            EmailVerified = insert.EmailVerified,
            TenantId = insert.TenantId,
            TenantIdentityProviderId = insert.TenantIdentityProviderId,
            CreatedUtc = createdUtc,
        };
    }

    public static AuthenticationIdentityRecord WithDisabled(
        AuthenticationIdentityRecord existing,
        DateTimeOffset disabledUtc) =>
        Clone(existing, disabledUtc: disabledUtc);

    public static AuthenticationIdentityRecord WithReEnabled(AuthenticationIdentityRecord existing) =>
        Clone(existing, clearDisabledUtc: true);

    public static AuthenticationIdentityRecord WithLastAuthenticated(
        AuthenticationIdentityRecord existing,
        DateTimeOffset authenticatedUtc) =>
        Clone(existing, lastAuthenticatedUtc: authenticatedUtc);

    public static AuthenticationIdentityRecord MapFromStorage(
        Guid id,
        Guid userId,
        string providerType,
        string normalizedIssuer,
        string subject,
        string? normalizedEmail,
        string? displayEmail,
        bool emailVerified,
        Guid? tenantId,
        Guid? tenantIdentityProviderId,
        DateTime createdUtc,
        DateTime? lastAuthenticatedUtc,
        DateTime? disabledUtc) =>
        new()
        {
            Id = id,
            UserId = userId,
            ProviderType = AuthenticationProviderTypeMapper.Parse(providerType),
            NormalizedIssuer = normalizedIssuer,
            Subject = subject,
            NormalizedEmail = normalizedEmail,
            DisplayEmail = displayEmail,
            EmailVerified = emailVerified,
            TenantId = tenantId,
            TenantIdentityProviderId = tenantIdentityProviderId,
            CreatedUtc = createdUtc,
            LastAuthenticatedUtc = lastAuthenticatedUtc,
            DisabledUtc = disabledUtc,
        };

    private static AuthenticationIdentityRecord Clone(
        AuthenticationIdentityRecord existing,
        DateTimeOffset? lastAuthenticatedUtc = null,
        DateTimeOffset? disabledUtc = null,
        bool clearDisabledUtc = false)
    {
        ArgumentNullException.ThrowIfNull(existing);

        return new AuthenticationIdentityRecord
        {
            Id = existing.Id,
            UserId = existing.UserId,
            ProviderType = existing.ProviderType,
            NormalizedIssuer = existing.NormalizedIssuer,
            Subject = existing.Subject,
            NormalizedEmail = existing.NormalizedEmail,
            DisplayEmail = existing.DisplayEmail,
            EmailVerified = existing.EmailVerified,
            TenantId = existing.TenantId,
            TenantIdentityProviderId = existing.TenantIdentityProviderId,
            CreatedUtc = existing.CreatedUtc,
            LastAuthenticatedUtc = lastAuthenticatedUtc ?? existing.LastAuthenticatedUtc,
            DisabledUtc = clearDisabledUtc ? null : disabledUtc ?? existing.DisabledUtc,
        };
    }
}
