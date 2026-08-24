using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed class DapperAuthenticationIdentityRepository(ISqlConnectionFactory connectionFactory)
    : IAuthenticationIdentityRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

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

    public async Task<AuthenticationIdentityRecord> InsertAsync(
        AuthenticationIdentityInsert insert,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(insert);

        Guid id = insert.Id != Guid.Empty ? insert.Id : Guid.NewGuid();

        const string sql = """
                           INSERT INTO dbo.AuthenticationIdentities
                               (Id, UserId, ProviderType, NormalizedIssuer, Subject, NormalizedEmail, DisplayEmail,
                                EmailVerified, TenantId, TenantIdentityProviderId)
                           OUTPUT INSERTED.Id,
                                  INSERTED.UserId,
                                  INSERTED.ProviderType,
                                  INSERTED.NormalizedIssuer,
                                  INSERTED.Subject,
                                  INSERTED.NormalizedEmail,
                                  INSERTED.DisplayEmail,
                                  INSERTED.EmailVerified,
                                  INSERTED.TenantId,
                                  INSERTED.TenantIdentityProviderId,
                                  INSERTED.CreatedUtc,
                                  INSERTED.LastAuthenticatedUtc,
                                  INSERTED.DisabledUtc
                           VALUES
                               (@Id, @UserId, @ProviderType, @NormalizedIssuer, @Subject, @NormalizedEmail, @DisplayEmail,
                                @EmailVerified, @TenantId, @TenantIdentityProviderId);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        try
        {
            AuthenticationIdentityRow row = await connection.QuerySingleAsync<AuthenticationIdentityRow>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        Id = id,
                        insert.UserId,
                        ProviderType = AuthenticationProviderTypeMapper.ToStorageString(insert.ProviderType),
                        insert.NormalizedIssuer,
                        insert.Subject,
                        insert.NormalizedEmail,
                        insert.DisplayEmail,
                        insert.EmailVerified,
                        insert.TenantId,
                        insert.TenantIdentityProviderId
                    },
                    cancellationToken: cancellationToken));

            return row.ToRecord();
        }
        catch (SqlException ex) when (ex.Number is 2601 or 2627)
        {
            throw new DuplicateAuthenticationIdentityException(
                new ExternalIdentityKey
                {
                    ProviderType = insert.ProviderType,
                    NormalizedIssuer = insert.NormalizedIssuer,
                    Subject = insert.Subject,
                    TenantId = insert.TenantId,
                    TenantIdentityProviderId = insert.TenantIdentityProviderId
                });
        }
    }

    public async Task DisableAsync(Guid identityId, DateTimeOffset disabledUtc, CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.AuthenticationIdentities
                           SET DisabledUtc = @DisabledUtc
                           WHERE Id = @Id
                             AND DisabledUtc IS NULL;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { Id = identityId, DisabledUtc = disabledUtc.UtcDateTime },
                cancellationToken: cancellationToken));
    }

    public async Task<bool> ReEnableAsync(Guid identityId, CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.AuthenticationIdentities
                           SET DisabledUtc = NULL
                           WHERE Id = @Id
                             AND DisabledUtc IS NOT NULL;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        try
        {
            int rows = await connection.ExecuteAsync(
                new CommandDefinition(sql, new { Id = identityId }, cancellationToken: cancellationToken));

            return rows > 0;
        }
        catch (SqlException ex) when (ex.Number is 2601 or 2627)
        {
            return false;
        }
    }

    public async Task RecordAuthenticationAsync(
        Guid identityId,
        DateTimeOffset authenticatedUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.AuthenticationIdentities
                           SET LastAuthenticatedUtc = @LastAuthenticatedUtc
                           WHERE Id = @Id;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { Id = identityId, LastAuthenticatedUtc = authenticatedUtc.UtcDateTime },
                cancellationToken: cancellationToken));
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
            new()
            {
                Id = Id,
                UserId = UserId,
                ProviderType = AuthenticationProviderTypeMapper.Parse(ProviderType),
                NormalizedIssuer = NormalizedIssuer,
                Subject = Subject,
                NormalizedEmail = NormalizedEmail,
                DisplayEmail = DisplayEmail,
                EmailVerified = EmailVerified,
                TenantId = TenantId,
                TenantIdentityProviderId = TenantIdentityProviderId,
                CreatedUtc = CreatedUtc,
                LastAuthenticatedUtc = LastAuthenticatedUtc,
                DisabledUtc = DisabledUtc
            };
    }
}
