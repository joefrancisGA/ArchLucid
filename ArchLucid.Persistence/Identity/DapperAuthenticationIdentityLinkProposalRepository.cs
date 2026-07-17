using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed class DapperAuthenticationIdentityLinkProposalRepository(ISqlConnectionFactory connectionFactory)
    : IAuthenticationIdentityLinkProposalRepository
{
    private const string SelectColumns = """
                                         Id,
                                         UserId,
                                         ProviderType,
                                         NormalizedIssuer,
                                         Subject,
                                         TenantId,
                                         TenantIdentityProviderId,
                                         NormalizedEmail,
                                         DisplayEmail,
                                         EmailVerified,
                                         RequiresExplicitConfirmation,
                                         Status,
                                         CreatedUtc,
                                         ExpiresUtc,
                                         ConfirmedUtc,
                                         CancelledUtc
                                         """;

    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<AuthenticationIdentityLinkProposalRecord> InsertAsync(
        AuthenticationIdentityLinkProposalRecord record,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           INSERT INTO dbo.AuthenticationIdentityLinkProposals
                           (
                               Id,
                               UserId,
                               ProviderType,
                               NormalizedIssuer,
                               Subject,
                               TenantId,
                               TenantIdentityProviderId,
                               NormalizedEmail,
                               DisplayEmail,
                               EmailVerified,
                               RequiresExplicitConfirmation,
                               Status,
                               CreatedUtc,
                               ExpiresUtc,
                               ConfirmedUtc,
                               CancelledUtc
                           )
                           VALUES
                           (
                               @Id,
                               @UserId,
                               @ProviderType,
                               @NormalizedIssuer,
                               @Subject,
                               @TenantId,
                               @TenantIdentityProviderId,
                               @NormalizedEmail,
                               @DisplayEmail,
                               @EmailVerified,
                               @RequiresExplicitConfirmation,
                               @Status,
                               @CreatedUtc,
                               @ExpiresUtc,
                               @ConfirmedUtc,
                               @CancelledUtc
                           );
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(sql, record, cancellationToken: cancellationToken));

        return record;
    }

    public async Task<AuthenticationIdentityLinkProposalRecord?> GetByIdAsync(
        Guid proposalId,
        CancellationToken cancellationToken)
    {
        string sql = $"""
                      SELECT {SelectColumns}
                      FROM dbo.AuthenticationIdentityLinkProposals
                      WHERE Id = @Id;
                      """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<AuthenticationIdentityLinkProposalRecord>(
            new CommandDefinition(sql, new { Id = proposalId }, cancellationToken: cancellationToken));
    }

    public async Task UpdateStatusAsync(
        Guid proposalId,
        AuthenticationIdentityLinkProposalStatus status,
        DateTimeOffset statusUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.AuthenticationIdentityLinkProposals
                           SET Status = @Status,
                               ConfirmedUtc = CASE WHEN @Status = 1 THEN @StatusUtc ELSE ConfirmedUtc END,
                               CancelledUtc = CASE WHEN @Status = 2 THEN @StatusUtc ELSE CancelledUtc END
                           WHERE Id = @Id;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { Id = proposalId, Status = status, StatusUtc = statusUtc },
                cancellationToken: cancellationToken));
    }
}
