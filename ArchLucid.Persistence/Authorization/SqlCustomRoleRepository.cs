using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Core.Authorization;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Authorization;

[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via API tests.")]
public sealed class SqlCustomRoleRepository(
    ISqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : ICustomRoleRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    public Task<IReadOnlyList<CustomRoleRecord>> ListByTenantAsync(Guid tenantId, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => ListByTenantCoreAsync(tenantId, ct), cancellationToken);

    public Task<CustomRoleRecord?> TryGetAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => TryGetCoreAsync(tenantId, roleId, ct), cancellationToken);

    public Task<CustomRoleRecord> CreateAsync(CustomRoleRecord record, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => CreateCoreAsync(record, ct), cancellationToken);

    public Task<CustomRoleRecord> UpdateAsync(CustomRoleRecord record, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => UpdateCoreAsync(record, ct), cancellationToken);

    public Task DeleteAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => DeleteCoreAsync(tenantId, roleId, ct), cancellationToken);

    public Task<IReadOnlyList<CustomRoleAssignmentWithRole>> ListAssignmentsForUserAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => ListAssignmentsForUserCoreAsync(tenantId, userId, ct), cancellationToken);

    public Task AssignAsync(UserCustomRoleAssignmentRecord assignment, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => AssignCoreAsync(assignment, ct), cancellationToken);

    public Task RemoveAssignmentAsync(
        Guid tenantId,
        Guid userId,
        Guid customRoleId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => RemoveAssignmentCoreAsync(tenantId, userId, customRoleId, ct), cancellationToken);

    public Task EnsureBuiltInRolesSeededAsync(Guid tenantId, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => EnsureBuiltInRolesSeededCoreAsync(tenantId, ct), cancellationToken);

    private async Task<IReadOnlyList<CustomRoleRecord>> ListByTenantCoreAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, TenantId, Name, Description, PermissionsJson, IsSystem, CreatedUtc, UpdatedUtc
                           FROM dbo.CustomRoles
                           WHERE TenantId = @TenantId
                           ORDER BY IsSystem DESC, Name ASC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<Row> rows = await connection.QueryAsync<Row>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.Select(static r => r.ToRecord()).ToList();
    }

    private async Task<CustomRoleRecord?> TryGetCoreAsync(
        Guid tenantId,
        Guid roleId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, TenantId, Name, Description, PermissionsJson, IsSystem, CreatedUtc, UpdatedUtc
                           FROM dbo.CustomRoles
                           WHERE TenantId = @TenantId AND Id = @Id;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await connection.QuerySingleOrDefaultAsync<Row>(
            new CommandDefinition(sql, new { TenantId = tenantId, Id = roleId }, cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    private async Task<CustomRoleRecord> CreateCoreAsync(CustomRoleRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           INSERT INTO dbo.CustomRoles (Id, TenantId, Name, Description, PermissionsJson, IsSystem)
                           VALUES (@Id, @TenantId, @Name, @Description, @PermissionsJson, @IsSystem);

                           SELECT Id, TenantId, Name, Description, PermissionsJson, IsSystem, CreatedUtc, UpdatedUtc
                           FROM dbo.CustomRoles
                           WHERE Id = @Id;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row row = await connection.QuerySingleAsync<Row>(
            new CommandDefinition(
                sql,
                new
                {
                    record.Id,
                    record.TenantId,
                    record.Name,
                    record.Description,
                    PermissionsJson = SerializePermissions(record.Permissions),
                    record.IsSystem,
                },
                cancellationToken: cancellationToken));

        return row.ToRecord();
    }

    private async Task<CustomRoleRecord> UpdateCoreAsync(CustomRoleRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           UPDATE dbo.CustomRoles
                           SET Name = @Name,
                               Description = @Description,
                               PermissionsJson = @PermissionsJson,
                               UpdatedUtc = SYSUTCDATETIME()
                           WHERE TenantId = @TenantId AND Id = @Id AND IsSystem = 0;

                           SELECT Id, TenantId, Name, Description, PermissionsJson, IsSystem, CreatedUtc, UpdatedUtc
                           FROM dbo.CustomRoles
                           WHERE TenantId = @TenantId AND Id = @Id;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await connection.QuerySingleOrDefaultAsync<Row>(
            new CommandDefinition(
                sql,
                new
                {
                    record.Id,
                    record.TenantId,
                    record.Name,
                    record.Description,
                    PermissionsJson = SerializePermissions(record.Permissions),
                },
                cancellationToken: cancellationToken));

        if (row is null)
            throw new InvalidOperationException("Custom role was not found or is a built-in system role.");

        return row.ToRecord();
    }

    private async Task DeleteCoreAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken)
    {
        const string sql = """
                           DELETE FROM dbo.CustomRoles
                           WHERE TenantId = @TenantId AND Id = @Id AND IsSystem = 0;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int affected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { TenantId = tenantId, Id = roleId }, cancellationToken: cancellationToken));

        if (affected == 0)
            throw new InvalidOperationException("Custom role was not found or is a built-in system role.");
    }

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

    private async Task EnsureBuiltInRolesSeededCoreAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        IReadOnlyList<(string Name, IReadOnlyList<string> Permissions)> seeds =
        [
            ("Admin", Permissions.BuiltInAdmin),
            ("Operator", Permissions.BuiltInOperator),
            ("Reader", Permissions.BuiltInReader),
            ("Auditor", Permissions.BuiltInAuditor),
        ];

        foreach ((string name, IReadOnlyList<string> permissions) in seeds)
        {
            const string existsSql = """
                                     SELECT TOP 1 1
                                     FROM dbo.CustomRoles
                                     WHERE TenantId = @TenantId AND Name = @Name AND IsSystem = 1;
                                     """;

            await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

            int? exists = await connection.ExecuteScalarAsync<int?>(
                new CommandDefinition(
                    existsSql,
                    new { TenantId = tenantId, Name = name },
                    cancellationToken: cancellationToken));

            if (exists.HasValue)
                continue;

            const string insertSql = """
                                     INSERT INTO dbo.CustomRoles (Id, TenantId, Name, Description, PermissionsJson, IsSystem)
                                     VALUES (@Id, @TenantId, @Name, @Description, @PermissionsJson, 1);
                                     """;

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertSql,
                    new
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Name = name,
                        Description = $"Built-in {name} role template.",
                        PermissionsJson = SerializePermissions(permissions),
                    },
                    cancellationToken: cancellationToken));
        }
    }

    private static string SerializePermissions(IReadOnlyList<string> permissions) =>
        JsonSerializer.Serialize(permissions);

    private static IReadOnlyList<string> DeserializePermissions(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        string[]? arr = JsonSerializer.Deserialize<string[]>(json);

        return arr ?? [];
    }

    private sealed class Row
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
