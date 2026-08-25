using System.Data;
using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Telemetry;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlRunRepository
{

    public async Task<RunRecord?> GetByIdAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(
                    RunRepositorySql.SelectByScopedId,
                    RunRecordParameters.ForRun(scope, runId),
                    cancellationToken: ct)).ConfigureAwait(false);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetRunByScopedId,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    public async Task<RunRecord?> GetByIdIncludingArchivedAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(
                    RunRepositorySql.SelectByScopedIdIncludingArchived,
                    RunRecordParameters.ForRun(scope, runId),
                    cancellationToken: ct)).ConfigureAwait(false);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetRunByScopedId,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    [TenantScopeExempt(TenantScopeExemptReason.Operational, "Admin run lookup by id within the active tenant catalog.")]
    public async Task<RunRecord?> GetByRunIdAdminAsync(Guid runId, CancellationToken ct)
    {
        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(RunRepositorySql.SelectByRunIdAdmin, new
                {
                    RunId = runId
                }, cancellationToken: ct)).ConfigureAwait(false);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetRunByIdAdmin,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    public async Task<RunRecord?> GetLatestWithGraphAtOrBeforeAsync(
        ScopeContext scope,
        string authorityProjectSlug,
        DateTime asOfUtc,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityProjectSlug);
        PersistenceTenantScope.RequireScopedTenant(scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(
                    RunRepositorySql.SelectLatestWithGraphAtOrBefore,
                    RunListQueryParameters.ForLatestGraphAtOrBefore(scope, authorityProjectSlug, asOfUtc),
                    cancellationToken: ct)).ConfigureAwait(false);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetLatestRunWithGraphAtOrBefore,
                sw.Elapsed.TotalMilliseconds);
        }
    }

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

    public async Task ClearGraphSnapshotForArchitectureAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (architectureId == Guid.Empty)
            return;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                RunRepositorySql.ClearGraphSnapshotForArchitecture,
                RunListQueryParameters.ForClearGraphSnapshotForArchitecture(scope, architectureId),
                cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task<Guid?> GetLatestRunIdForArchitectureAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (architectureId == Guid.Empty)
            return null;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                RunRepositorySql.SelectLatestRunIdForArchitecture,
                RunListQueryParameters.ForLatestRunIdForArchitecture(scope, architectureId),
                cancellationToken: ct)).ConfigureAwait(false);
    }

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
