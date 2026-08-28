using ArchLucid.Core.Identity;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

public sealed partial class DapperAuthenticationIdentityRepository
{
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
}
