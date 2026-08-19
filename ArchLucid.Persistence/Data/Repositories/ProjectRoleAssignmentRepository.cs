using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Authorization;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

/// <inheritdoc cref="IProjectRoleAssignmentRepository"/>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; integration tests cover via policy handler / SQL hosts.")]
public sealed class ProjectRoleAssignmentRepository(IDbConnectionFactory connectionFactory)
    : IProjectRoleAssignmentRepository
{
    /// <inheritdoc />
    public async Task<ProjectScopedEffectiveRole> GetHighestRoleAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid scimUserId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT TOP (1) Role
                           FROM dbo.ProjectRoleAssignments
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND UserId = @UserId
                           ORDER BY CASE Role
                                        WHEN N'ProjectAdmin' THEN 3
                                        WHEN N'Operator' THEN 2
                                        WHEN N'Reader' THEN 1
                                        ELSE 0
                                    END DESC;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string? role = await connection.QueryFirstOrDefaultAsync<string?>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId, UserId = scimUserId },
                cancellationToken: cancellationToken));

        return ProjectRoleAssignmentRole.ParseRank(role ?? string.Empty);
    }
}
