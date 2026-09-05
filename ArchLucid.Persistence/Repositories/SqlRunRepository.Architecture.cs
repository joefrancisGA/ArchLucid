using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlRunRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<RunRecord>> ListByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (architectureId == Guid.Empty)
            return [];

        const string sql = """
                           SELECT RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, Description,
                                  PackageOrigin, ArchitectureId, ArchitectureVersionId, CreatedUtc, UpdatedUtc,
                                  ArchivedUtc, LegacyRunStatus, CurrentManifestVersion, GoldenManifestId
                           FROM dbo.Runs
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId
                             AND ArchitectureId = @ArchitectureId
                             AND ArchivedUtc IS NULL
                           ORDER BY CreatedUtc DESC, RunId DESC;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        IEnumerable<RunRecord> rows = await connection.QueryAsync<RunRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ArchitectureId = architectureId,
                },
                cancellationToken: ct)).ConfigureAwait(false);

        return rows.ToList();
    }

    /// <inheritdoc />
    public async Task<int> CountByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (architectureId == Guid.Empty)
            return 0;

        const string sql = """
                           SELECT COUNT(1)
                           FROM dbo.Runs
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId
                             AND ArchitectureId = @ArchitectureId
                             AND ArchivedUtc IS NULL;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ArchitectureId = architectureId,
                },
                cancellationToken: ct)).ConfigureAwait(false);
    }
}
