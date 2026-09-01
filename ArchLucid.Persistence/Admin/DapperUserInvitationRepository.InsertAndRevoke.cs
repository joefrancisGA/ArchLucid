using ArchLucid.Core.Admin;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Admin;

public sealed partial class DapperUserInvitationRepository
{
    public async Task<UserInvitationRecord> InsertAsync(
        Guid tenantId,
        Guid workspaceId,
        string normalizedEmail,
        string appRole,
        string invitedByActorId,
        string? message,
        byte[] tokenHash,
        DateTimeOffset expiresUtc,
        CancellationToken cancellationToken)
    {
        Guid id = Guid.NewGuid();

        const string sql = """
                           INSERT INTO dbo.UserInvitations
                               (Id, TenantId, WorkspaceId, Email, AppRole, InvitedByActorId, Message, TokenHash, Status, ExpiresUtc)
                           OUTPUT INSERTED.Id, INSERTED.TenantId, INSERTED.WorkspaceId, INSERTED.Email, INSERTED.AppRole,
                                  INSERTED.InvitedByActorId, INSERTED.Message, INSERTED.Status, INSERTED.CreatedUtc,
                                  INSERTED.ExpiresUtc, INSERTED.RevokedUtc, INSERTED.AcceptedUtc
                           VALUES
                               (@Id, @TenantId, @WorkspaceId, @Email, @AppRole, @InvitedByActorId, @Message, @TokenHash,
                                N'Pending', @ExpiresUtc);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        InvitationRow row = await connection.QuerySingleAsync<InvitationRow>(
            new CommandDefinition(
                sql,
                new
                {
                    Id = id,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    Email = normalizedEmail,
                    AppRole = appRole,
                    InvitedByActorId = invitedByActorId,
                    Message = message,
                    TokenHash = tokenHash,
                    ExpiresUtc = expiresUtc.UtcDateTime
                },
                cancellationToken: cancellationToken));

        return row.ToRecord();
    }

    public async Task<bool> RevokeAsync(
        Guid tenantId,
        Guid invitationId,
        DateTimeOffset revokedUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.UserInvitations
                           SET Status = N'Revoked', RevokedUtc = @RevokedUtc
                           WHERE TenantId = @TenantId
                             AND Id = @Id
                             AND Status = N'Pending';
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int affected = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    Id = invitationId,
                    RevokedUtc = revokedUtc.UtcDateTime
                },
                cancellationToken: cancellationToken));

        return affected == 1;
    }
}
