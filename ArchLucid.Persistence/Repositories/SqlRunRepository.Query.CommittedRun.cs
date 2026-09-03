using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlRunRepository
{

    /// <inheritdoc />
    public async Task<Guid?> GetLatestCommittedRunIdByManifestCreatedUtcAsync(
        ScopeContext scope,
        string projectId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(projectId);
        PersistenceTenantScope.RequireScopedTenant(scope);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                RunRepositorySql.SelectLatestCommittedRunIdByManifestCreatedUtc,
                RunListQueryParameters.ForLatestCommittedByManifestCreatedUtc(scope, projectId),
                cancellationToken: ct)).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<Guid?> GetPriorCommittedRunIdBeforeCurrentAsync(
        ScopeContext scope,
        string projectId,
        Guid currentRunId,
        DateTime currentCreatedUtc,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(projectId);
        PersistenceTenantScope.RequireScopedTenant(scope);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                RunRepositorySql.SelectPriorCommittedRunIdBeforeCurrent,
                RunListQueryParameters.ForPriorCommittedRunBeforeCurrent(
                    scope,
                    projectId,
                    currentRunId,
                    currentCreatedUtc),
                cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task<Guid?> GetPriorCommittedRunIdForArchitectureBeforeCurrentAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid currentRunId,
        DateTime currentCreatedUtc,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (architectureId == Guid.Empty)
            return null;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                RunRepositorySql.SelectPriorCommittedRunIdForArchitectureBeforeCurrent,
                RunListQueryParameters.ForPriorCommittedRunForArchitectureBeforeCurrent(
                    scope,
                    architectureId,
                    currentRunId,
                    currentCreatedUtc),
                cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task<Guid?> GetCommittedRunIdByGoldenManifestIdAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid goldenManifestId,
        Guid excludeRunId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (architectureId == Guid.Empty || goldenManifestId == Guid.Empty)
            return null;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                RunRepositorySql.SelectCommittedRunIdByGoldenManifestId,
                RunListQueryParameters.ForCommittedRunByGoldenManifestId(
                    scope,
                    architectureId,
                    goldenManifestId,
                    excludeRunId),
                cancellationToken: ct)).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<Guid?> GetLatestCommittedRunIdByArchitectureVersionIdAsync(
        ScopeContext scope,
        Guid architectureVersionId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (architectureVersionId == Guid.Empty)
            return null;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                RunRepositorySql.SelectLatestCommittedRunIdByArchitectureVersionId,
                RunListQueryParameters.ForLatestCommittedRunIdByArchitectureVersionId(scope, architectureVersionId),
                cancellationToken: ct)).ConfigureAwait(false);
    }
}
