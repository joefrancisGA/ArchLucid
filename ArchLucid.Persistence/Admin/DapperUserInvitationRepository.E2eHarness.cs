using ArchLucid.Core.Admin;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Admin;

public sealed partial class DapperUserInvitationRepository
{
    /// <inheritdoc />
    public async Task E2eHarnessSetExpiresUtcAsync(
        Guid invitationId,
        DateTimeOffset expiresUtc,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.UserInvitations
                           SET ExpiresUtc = @ExpiresUtc
                           WHERE Id = @InvitationId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    InvitationId = invitationId,
                    ExpiresUtc = expiresUtc,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }
}
