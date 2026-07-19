using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Admin;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Admin;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed class DapperUserInvitationRepository(ISqlConnectionFactory connectionFactory) : IUserInvitationRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

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

    private sealed class InvitationRow
    {
        public Guid Id
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid WorkspaceId
        {
            get;
            init;
        }

        public string Email
        {
            get;
            init;
        } = string.Empty;

        public string AppRole
        {
            get;
            init;
        } = string.Empty;

        public string InvitedByActorId
        {
            get;
            init;
        } = string.Empty;

        public string? Message
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

        public DateTime ExpiresUtc
        {
            get;
            init;
        }

        public DateTime? RevokedUtc
        {
            get;
            init;
        }

        public DateTime? AcceptedUtc
        {
            get;
            init;
        }

        public UserInvitationRecord ToRecord()
        {
            if (!Enum.TryParse(Status, ignoreCase: true, out UserInvitationStatus status))
            {
                status = UserInvitationStatus.Pending;
            }

            return new UserInvitationRecord
            {
                Id = Id,
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                Email = Email,
                AppRole = AppRole,
                InvitedByActorId = InvitedByActorId,
                Message = Message,
                Status = status,
                CreatedUtc = new DateTimeOffset(DateTime.SpecifyKind(CreatedUtc, DateTimeKind.Utc)),
                ExpiresUtc = new DateTimeOffset(DateTime.SpecifyKind(ExpiresUtc, DateTimeKind.Utc)),
                RevokedUtc = RevokedUtc is null
                    ? null
                    : new DateTimeOffset(DateTime.SpecifyKind(RevokedUtc.Value, DateTimeKind.Utc)),
                AcceptedUtc = AcceptedUtc is null
                    ? null
                    : new DateTimeOffset(DateTime.SpecifyKind(AcceptedUtc.Value, DateTimeKind.Utc))
            };
        }
    }
}
