using ArchLucid.Core.Authorization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Authorization;

public sealed partial class SqlCustomRoleRepository
{
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
}
