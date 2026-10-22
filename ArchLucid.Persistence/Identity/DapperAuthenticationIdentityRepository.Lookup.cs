// stryker disable all
using ArchLucid.Core.Identity;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

public sealed partial class DapperAuthenticationIdentityRepository
{
    public async Task<AuthenticationIdentityRecord?> FindByExternalKeyAsync(
        ExternalIdentityKey key,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(key);

        const string sql = """
                           SELECT TOP 1 Id, UserId, ProviderType, NormalizedIssuer, Subject, NormalizedEmail, DisplayEmail,
                                  EmailVerified, TenantId, TenantIdentityProviderId, CreatedUtc, LastAuthenticatedUtc, DisabledUtc
                           FROM dbo.AuthenticationIdentities
                           WHERE ProviderType = @ProviderType
                             AND NormalizedIssuer = @NormalizedIssuer
                             AND Subject = @Subject
                             AND IdentityScopeKey = @IdentityScopeKey
                             AND DisabledUtc IS NULL;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AuthenticationIdentityRow? row = await connection.QuerySingleOrDefaultAsync<AuthenticationIdentityRow>(
            new CommandDefinition(
                sql,
                new
                {
                    ProviderType = AuthenticationProviderTypeMapper.ToStorageString(key.ProviderType),
                    key.NormalizedIssuer,
                    key.Subject,
                    IdentityScopeKey = AuthenticationProviderTypeMapper.BuildIdentityScopeKey(
                        key.TenantId,
                        key.TenantIdentityProviderId)
                },
                cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    public async Task<AuthenticationIdentityRecord?> FindAnyByExternalKeyAsync(
        ExternalIdentityKey key,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(key);

        const string sql = """
                           SELECT TOP 1 Id, UserId, ProviderType, NormalizedIssuer, Subject, NormalizedEmail, DisplayEmail,
                                  EmailVerified, TenantId, TenantIdentityProviderId, CreatedUtc, LastAuthenticatedUtc, DisabledUtc
                           FROM dbo.AuthenticationIdentities
                           WHERE ProviderType = @ProviderType
                             AND NormalizedIssuer = @NormalizedIssuer
                             AND Subject = @Subject
                             AND IdentityScopeKey = @IdentityScopeKey
                           ORDER BY CASE WHEN DisabledUtc IS NULL THEN 0 ELSE 1 END, CreatedUtc DESC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AuthenticationIdentityRow? row = await connection.QuerySingleOrDefaultAsync<AuthenticationIdentityRow>(
            new CommandDefinition(
                sql,
                new
                {
                    ProviderType = AuthenticationProviderTypeMapper.ToStorageString(key.ProviderType),
                    key.NormalizedIssuer,
                    key.Subject,
                    IdentityScopeKey = AuthenticationProviderTypeMapper.BuildIdentityScopeKey(
                        key.TenantId,
                        key.TenantIdentityProviderId)
                },
                cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    public async Task<AuthenticationIdentityRecord?> GetByIdAsync(Guid identityId, CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, UserId, ProviderType, NormalizedIssuer, Subject, NormalizedEmail, DisplayEmail,
                                  EmailVerified, TenantId, TenantIdentityProviderId, CreatedUtc, LastAuthenticatedUtc, DisabledUtc
                           FROM dbo.AuthenticationIdentities
                           WHERE Id = @Id;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AuthenticationIdentityRow? row = await connection.QuerySingleOrDefaultAsync<AuthenticationIdentityRow>(
            new CommandDefinition(sql, new { Id = identityId }, cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    public async Task<IReadOnlyList<AuthenticationIdentityRecord>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, UserId, ProviderType, NormalizedIssuer, Subject, NormalizedEmail, DisplayEmail,
                                  EmailVerified, TenantId, TenantIdentityProviderId, CreatedUtc, LastAuthenticatedUtc, DisabledUtc
                           FROM dbo.AuthenticationIdentities
                           WHERE UserId = @UserId
                           ORDER BY CreatedUtc;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AuthenticationIdentityRow> rows = await connection.QueryAsync<AuthenticationIdentityRow>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: cancellationToken));

        return rows.Select(static row => row.ToRecord()).ToList();
    }

    public async Task<bool> HasActiveIdentityAsync(Guid userId, CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT CASE WHEN EXISTS (
                               SELECT 1
                               FROM dbo.AuthenticationIdentities
                               WHERE UserId = @UserId
                                 AND DisabledUtc IS NULL) THEN 1 ELSE 0 END;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: cancellationToken));
    }

    private sealed class AuthenticationIdentityRow
    {
        public Guid Id
        {
            get;
            init;
        }

        public Guid UserId
        {
            get;
            init;
        }

        public string ProviderType
        {
            get;
            init;
        } = string.Empty;

        public string NormalizedIssuer
        {
            get;
            init;
        } = string.Empty;

        public string Subject
        {
            get;
            init;
        } = string.Empty;

        public string? NormalizedEmail
        {
            get;
            init;
        }

        public string? DisplayEmail
        {
            get;
            init;
        }

        public bool EmailVerified
        {
            get;
            init;
        }

        public Guid? TenantId
        {
            get;
            init;
        }

        public Guid? TenantIdentityProviderId
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime? LastAuthenticatedUtc
        {
            get;
            init;
        }

        public DateTime? DisabledUtc
        {
            get;
            init;
        }

        public AuthenticationIdentityRecord ToRecord() =>
            AuthenticationIdentityRepositoryCore.MapFromStorage(
                Id,
                UserId,
                ProviderType,
                NormalizedIssuer,
                Subject,
                NormalizedEmail,
                DisplayEmail,
                EmailVerified,
                TenantId,
                TenantIdentityProviderId,
                CreatedUtc,
                LastAuthenticatedUtc,
                DisabledUtc);
    }
}
