using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed class DapperPlatformUserRepository(ISqlConnectionFactory connectionFactory) : IPlatformUserRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<PlatformUserRecord?> GetByIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, PrimaryEmail, NormalizedPrimaryEmail, DisplayName, Status, CreatedUtc, UpdatedUtc, AuthVersion
                           FROM dbo.PlatformUsers
                           WHERE Id = @Id;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        PlatformUserRow? row = await connection.QuerySingleOrDefaultAsync<PlatformUserRow>(
            new CommandDefinition(sql, new { Id = userId }, cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    public async Task<PlatformUserRecord> InsertAsync(PlatformUserInsert insert, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(insert);

        Guid id = insert.Id != Guid.Empty ? insert.Id : Guid.NewGuid();

        const string sql = """
                           INSERT INTO dbo.PlatformUsers
                               (Id, PrimaryEmail, NormalizedPrimaryEmail, DisplayName, Status)
                           OUTPUT INSERTED.Id,
                                  INSERTED.PrimaryEmail,
                                  INSERTED.NormalizedPrimaryEmail,
                                  INSERTED.DisplayName,
                                  INSERTED.Status,
                                  INSERTED.CreatedUtc,
                                  INSERTED.UpdatedUtc,
                                  INSERTED.AuthVersion
                           VALUES
                               (@Id, @PrimaryEmail, @NormalizedPrimaryEmail, @DisplayName, @Status);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        PlatformUserRow row = await connection.QuerySingleAsync<PlatformUserRow>(
            new CommandDefinition(
                sql,
                new
                {
                    Id = id,
                    insert.PrimaryEmail,
                    insert.NormalizedPrimaryEmail,
                    insert.DisplayName,
                    Status = AuthenticationProviderTypeMapper.PlatformUserStatusToStorage(insert.Status)
                },
                cancellationToken: cancellationToken));

        return row.ToRecord();
    }

    public async Task UpdateStatusAsync(
        Guid userId,
        PlatformUserStatus status,
        DateTimeOffset updatedUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.PlatformUsers
                           SET Status = @Status,
                               UpdatedUtc = @UpdatedUtc
                           WHERE Id = @Id;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int affected = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Id = userId,
                    Status = AuthenticationProviderTypeMapper.PlatformUserStatusToStorage(status),
                    UpdatedUtc = updatedUtc.UtcDateTime
                },
                cancellationToken: cancellationToken));

        if (affected == 0)
        {
            throw new PlatformUserNotFoundException(userId);
        }
    }

    public async Task UpdatePrimaryEmailAsync(
        Guid userId,
        string primaryEmail,
        string normalizedPrimaryEmail,
        DateTimeOffset updatedUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.PlatformUsers
                           SET PrimaryEmail = @PrimaryEmail,
                               NormalizedPrimaryEmail = @NormalizedPrimaryEmail,
                               UpdatedUtc = @UpdatedUtc
                           WHERE Id = @Id;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int affected = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Id = userId,
                    PrimaryEmail = primaryEmail,
                    NormalizedPrimaryEmail = normalizedPrimaryEmail,
                    UpdatedUtc = updatedUtc.UtcDateTime
                },
                cancellationToken: cancellationToken));

        if (affected == 0)
        {
            throw new PlatformUserNotFoundException(userId);
        }
    }

    public async Task RotateAuthVersionAsync(
        Guid userId,
        Guid authVersion,
        DateTimeOffset updatedUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.PlatformUsers
                           SET AuthVersion = @AuthVersion,
                               UpdatedUtc = @UpdatedUtc
                           WHERE Id = @Id;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int affected = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Id = userId,
                    AuthVersion = authVersion,
                    UpdatedUtc = updatedUtc.UtcDateTime
                },
                cancellationToken: cancellationToken));

        if (affected == 0)
        {
            throw new PlatformUserNotFoundException(userId);
        }
    }

    private sealed class PlatformUserRow
    {
        public Guid Id
        {
            get;
            init;
        }

        public string? PrimaryEmail
        {
            get;
            init;
        }

        public string? NormalizedPrimaryEmail
        {
            get;
            init;
        }

        public string? DisplayName
        {
            get;
            init;
        }

        public string Status
        {
            get;
            init;
        } = string.Empty;

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }

        public Guid AuthVersion
        {
            get;
            init;
        }

        public PlatformUserRecord ToRecord() =>
            new()
            {
                Id = Id,
                PrimaryEmail = PrimaryEmail,
                NormalizedPrimaryEmail = NormalizedPrimaryEmail,
                DisplayName = DisplayName,
                Status = AuthenticationProviderTypeMapper.ParsePlatformUserStatus(Status),
                CreatedUtc = CreatedUtc,
                UpdatedUtc = UpdatedUtc,
                AuthVersion = AuthVersion
            };
    }
}
