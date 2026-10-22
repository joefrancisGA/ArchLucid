using ArchLucid.Core.Authorization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Authorization;

public sealed partial class SqlCustomRoleRepository
{
    private async Task<IReadOnlyList<CustomRoleAssignmentWithRole>> ListAssignmentsForUserCoreAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT a.UserId,
                                  r.Id,
                                  r.TenantId,
                                  r.Name,
                                  r.Description,
                                  r.PermissionsJson,
                                  r.IsSystem,
                                  r.CreatedUtc,
                                  r.UpdatedUtc
                           FROM dbo.UserCustomRoleAssignments AS a
                           INNER JOIN dbo.CustomRoles AS r ON r.Id = a.CustomRoleId
                           WHERE r.TenantId = @TenantId AND a.UserId = @UserId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AssignmentRow> rows = await connection.QueryAsync<AssignmentRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, UserId = userId },
                cancellationToken: cancellationToken));

        return rows
            .Select(r => new CustomRoleAssignmentWithRole
            {
                UserId = r.UserId,
                Role = r.ToRecord(),
            })
            .ToList();
    }

    private async Task AssignCoreAsync(UserCustomRoleAssignmentRecord assignment, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(assignment);

        const string sql = """
                           INSERT INTO dbo.UserCustomRoleAssignments (UserId, CustomRoleId, AssignedByActorId)
                           VALUES (@UserId, @CustomRoleId, @AssignedByActorId);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    assignment.UserId,
                    assignment.CustomRoleId,
                    assignment.AssignedByActorId,
                },
                cancellationToken: cancellationToken));
    }

    private async Task RemoveAssignmentCoreAsync(
        Guid tenantId,
        Guid userId,
        Guid customRoleId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           DELETE a
                           FROM dbo.UserCustomRoleAssignments AS a
                           INNER JOIN dbo.CustomRoles AS r ON r.Id = a.CustomRoleId
                           WHERE r.TenantId = @TenantId AND a.UserId = @UserId AND a.CustomRoleId = @CustomRoleId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, UserId = userId, CustomRoleId = customRoleId },
                cancellationToken: cancellationToken));
    }

    private sealed class AssignmentRow
    {
        public Guid UserId
        {
            get;
            init;
        }

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

        public string Name
        {
            get;
            init;
        } = string.Empty;

        public string? Description
        {
            get;
            init;
        }

        public string PermissionsJson
        {
            get;
            init;
        } = "[]";

        public bool IsSystem
        {
            get;
            init;
        }

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

        public CustomRoleRecord ToRecord()
        {
            return new CustomRoleRecord
            {
                Id = Id,
                TenantId = TenantId,
                Name = Name,
                Description = Description,
                Permissions = DeserializePermissions(PermissionsJson),
                IsSystem = IsSystem,
                CreatedUtc = new DateTimeOffset(DateTime.SpecifyKind(CreatedUtc, DateTimeKind.Utc)),
                UpdatedUtc = new DateTimeOffset(DateTime.SpecifyKind(UpdatedUtc, DateTimeKind.Utc)),
            };
        }
    }
}
