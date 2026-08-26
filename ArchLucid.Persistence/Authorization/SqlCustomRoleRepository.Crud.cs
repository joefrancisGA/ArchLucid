using System.Text.Json;

using ArchLucid.Core.Authorization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Authorization;

public sealed partial class SqlCustomRoleRepository
{
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
}
