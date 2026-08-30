using ArchLucid.Core.Admin;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Admin;

public sealed partial class DapperUserInvitationRepository
{
    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Invitation acceptance resolves pending row by invitation id before tenant scope is established.")]
    public async Task<UserInvitationRecord?> GetPendingByIdAsync(
        Guid invitationId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, TenantId, WorkspaceId, Email, AppRole, InvitedByActorId, Message, Status,
                                  CreatedUtc, ExpiresUtc, RevokedUtc, AcceptedUtc
                           FROM dbo.UserInvitations
                           WHERE Id = @Id
                             AND Status = N'Pending'
                             AND ExpiresUtc > SYSUTCDATETIME();
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        InvitationRow? row = await connection.QuerySingleOrDefaultAsync<InvitationRow>(
            new CommandDefinition(sql, new { Id = invitationId }, cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Public invitation redemption resolves pending row by opaque token hash.")]
    public async Task<UserInvitationRecord?> GetPendingByTokenHashAsync(
        byte[] tokenHash,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, TenantId, WorkspaceId, Email, AppRole, InvitedByActorId, Message, Status,
                                  CreatedUtc, ExpiresUtc, RevokedUtc, AcceptedUtc
                           FROM dbo.UserInvitations
                           WHERE TokenHash = @TokenHash
                             AND Status = N'Pending'
                             AND ExpiresUtc > SYSUTCDATETIME();
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        InvitationRow? row = await connection.QuerySingleOrDefaultAsync<InvitationRow>(
            new CommandDefinition(sql, new { TokenHash = tokenHash }, cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Invitation token diagnostics resolve row by opaque token hash before tenant scope is established.")]
    public async Task<UserInvitationRecord?> GetByTokenHashAsync(
        byte[] tokenHash,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, TenantId, WorkspaceId, Email, AppRole, InvitedByActorId, Message, Status,
                                  CreatedUtc, ExpiresUtc, RevokedUtc, AcceptedUtc
                           FROM dbo.UserInvitations
                           WHERE TokenHash = @TokenHash;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        InvitationRow? row = await connection.QuerySingleOrDefaultAsync<InvitationRow>(
            new CommandDefinition(sql, new { TokenHash = tokenHash }, cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Sign-in email collision checks list pending invitations by normalized email across tenants.")]
    public async Task<IReadOnlyList<UserInvitationRecord>> ListPendingByNormalizedEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, TenantId, WorkspaceId, Email, AppRole, InvitedByActorId, Message, Status,
                                  CreatedUtc, ExpiresUtc, RevokedUtc, AcceptedUtc
                           FROM dbo.UserInvitations
                           WHERE Email = @Email
                             AND Status = N'Pending'
                             AND ExpiresUtc > SYSUTCDATETIME()
                           ORDER BY CreatedUtc DESC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<InvitationRow> rows = await connection.QueryAsync<InvitationRow>(
            new CommandDefinition(sql, new { Email = normalizedEmail }, cancellationToken: cancellationToken));

        return rows.Select(static row => row.ToRecord()).ToList();
    }

    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Invitation acceptance marks row accepted by invitation id after token redemption.")]
    public async Task<bool> MarkAcceptedAsync(
        Guid invitationId,
        DateTimeOffset acceptedUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.UserInvitations
                           SET Status = N'Accepted', AcceptedUtc = @AcceptedUtc
                           WHERE Id = @Id
                             AND Status = N'Pending';
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int affected = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { Id = invitationId, AcceptedUtc = acceptedUtc.UtcDateTime },
                cancellationToken: cancellationToken));

        return affected == 1;
    }
}
