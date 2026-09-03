using System.Data;

using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlRunRepository
{

    /// <inheritdoc />
    public async Task<int> CountActiveRunsForArchitectureRequestAsync(
        ScopeContext scope,
        string architectureRequestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        RunRepositoryCore.RequireArchitectureRequestId(architectureRequestId);

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.QuerySingleAsync<int>(
            new CommandDefinition(
                RunRepositorySql.CountActiveRunsForArchitectureRequest,
                RunListQueryParameters.ForActiveRunCountByArchitectureRequest(scope, architectureRequestId),
                cancellationToken: ct)).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<bool> ExistsRunForArchitectureRequestInScopeAsync(
        ScopeContext scope,
        string architectureRequestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        RunRepositoryCore.RequireArchitectureRequestId(architectureRequestId);

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        int exists = await connection.QuerySingleAsync<int>(
            new CommandDefinition(
                RunRepositorySql.ExistsRunForArchitectureRequestInScope,
                RunListQueryParameters.ForArchitectureRequestScopeExists(scope, architectureRequestId),
                cancellationToken: ct)).ConfigureAwait(false);

        return exists == 1;
    }

    /// <inheritdoc />
    public async Task<bool> ExistsActiveRunWithSystemNameInWorkspaceAsync(
        ScopeContext scope,
        string systemName,
        Guid? excludeRunId = null,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        RunRepositoryCore.RequireSystemName(systemName);

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        int exists = await connection.QuerySingleAsync<int>(
            new CommandDefinition(
                RunRepositorySql.ExistsActiveRunWithSystemNameInWorkspace,
                RunListQueryParameters.ForActiveRunWithSystemNameInWorkspace(scope, systemName, excludeRunId),
                cancellationToken: ct)).ConfigureAwait(false);

        return exists == 1;
    }
}
