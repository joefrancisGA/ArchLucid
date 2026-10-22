using ArchLucid.Core.Admin;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Admin;

public sealed partial class DapperUserInvitationRepository
{
    public async Task<UserInvitationRecord?> GetPendingByEmailAsync(
        Guid tenantId,
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, TenantId, WorkspaceId, Email, AppRole, InvitedByActorId, Message, Status,
                                  CreatedUtc, ExpiresUtc, RevokedUtc, AcceptedUtc
                           FROM dbo.UserInvitations
                           WHERE TenantId = @TenantId
                             AND Email = @Email
                             AND Status = N'Pending'
                             AND ExpiresUtc > SYSUTCDATETIME();
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        InvitationRow? row = await connection.QuerySingleOrDefaultAsync<InvitationRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, Email = normalizedEmail },
                cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    public async Task<UserInvitationRecord?> GetByIdAsync(
        Guid tenantId,
        Guid invitationId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, TenantId, WorkspaceId, Email, AppRole, InvitedByActorId, Message, Status,
                                  CreatedUtc, ExpiresUtc, RevokedUtc, AcceptedUtc
                           FROM dbo.UserInvitations
                           WHERE TenantId = @TenantId
                             AND Id = @Id;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        InvitationRow? row = await connection.QuerySingleOrDefaultAsync<InvitationRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, Id = invitationId },
                cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    public async Task<IReadOnlyList<UserInvitationRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, TenantId, WorkspaceId, Email, AppRole, InvitedByActorId, Message, Status,
                                  CreatedUtc, ExpiresUtc, RevokedUtc, AcceptedUtc
                           FROM dbo.UserInvitations
                           WHERE TenantId = @TenantId
                           ORDER BY CreatedUtc DESC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<InvitationRow> rows = await connection.QueryAsync<InvitationRow>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.Select(static row => row.ToRecord()).ToList();
    }
}
