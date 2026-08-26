using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Decorates <see cref="IRunRepository" /> with hot-path read caching and evicts on single-row writes and after bulk
///     archival.
/// </summary>
public sealed partial class CachingRunRepository(IRunRepository inner, IHotPathReadCache hotPathReadCache) : IRunRepository
{
    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly IRunRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public Task<RunRecord?> GetByIdAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.Run(scope, runId),
            innerCt => _inner.GetByIdAsync(scope, runId, innerCt),
            ct);
    }

    /// <inheritdoc />
    public Task<RunRecord?> GetByIdIncludingArchivedAsync(ScopeContext scope, Guid runId, CancellationToken ct)
        => _inner.GetByIdIncludingArchivedAsync(scope, runId, ct);

    /// <inheritdoc />
    public Task<RunRecord?> GetByRunIdAdminAsync(Guid runId, CancellationToken ct)
        => _inner.GetByRunIdAdminAsync(runId, ct);

    /// <inheritdoc />
    public Task<RunRecord?> GetLatestWithGraphAtOrBeforeAsync(
        ScopeContext scope,
        string authorityProjectSlug,
        DateTime asOfUtc,
        CancellationToken ct)
        => _inner.GetLatestWithGraphAtOrBeforeAsync(scope, authorityProjectSlug, asOfUtc, ct);

    /// <inheritdoc />
    public Task<Guid?> GetLatestCommittedRunIdByManifestCreatedUtcAsync(
        ScopeContext scope,
        string projectId,
        CancellationToken ct)
        => _inner.GetLatestCommittedRunIdByManifestCreatedUtcAsync(scope, projectId, ct);

    /// <inheritdoc />
    public Task<Guid?> GetPriorCommittedRunIdBeforeCurrentAsync(
        ScopeContext scope,
        string projectId,
        Guid currentRunId,
        DateTime currentCreatedUtc,
        CancellationToken ct)
        => _inner.GetPriorCommittedRunIdBeforeCurrentAsync(
            scope,
            projectId,
            currentRunId,
            currentCreatedUtc,
            ct);

    /// <inheritdoc />
    public Task<Guid?> GetPriorCommittedRunIdForArchitectureBeforeCurrentAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid currentRunId,
        DateTime currentCreatedUtc,
        CancellationToken ct)
        => _inner.GetPriorCommittedRunIdForArchitectureBeforeCurrentAsync(
            scope,
            architectureId,
            currentRunId,
            currentCreatedUtc,
            ct);

    /// <inheritdoc />
    public Task<Guid?> GetCommittedRunIdByGoldenManifestIdAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid goldenManifestId,
        Guid excludeRunId,
        CancellationToken ct)
        => _inner.GetCommittedRunIdByGoldenManifestIdAsync(
            scope,
            architectureId,
            goldenManifestId,
            excludeRunId,
            ct);

    /// <inheritdoc />
    public Task ClearGraphSnapshotForArchitectureAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken ct)
        => _inner.ClearGraphSnapshotForArchitectureAsync(scope, architectureId, ct);

    /// <inheritdoc />
    public Task<Guid?> GetLatestRunIdForArchitectureAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken ct)
        => _inner.GetLatestRunIdForArchitectureAsync(scope, architectureId, ct);

    /// <inheritdoc />
    public Task<int> CountActiveRunsForArchitectureRequestAsync(
        ScopeContext scope,
        string architectureRequestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _inner.CountActiveRunsForArchitectureRequestAsync(scope, architectureRequestId, ct);
    }

    /// <inheritdoc />
    public Task<bool> ExistsRunForArchitectureRequestInScopeAsync(
        ScopeContext scope,
        string architectureRequestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _inner.ExistsRunForArchitectureRequestInScopeAsync(scope, architectureRequestId, ct);
    }

    /// <inheritdoc />
    public Task<bool> ExistsActiveRunWithSystemNameInWorkspaceAsync(
        ScopeContext scope,
        string systemName,
        Guid? excludeRunId = null,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _inner.ExistsActiveRunWithSystemNameInWorkspaceAsync(scope, systemName, excludeRunId, ct);
    }

    /// <inheritdoc />
    public async Task SaveAsync(
        RunRecord run,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        await _inner.SaveAsync(run, ct, connection, transaction);

        ScopeContext scope = ScopeForRun(run);
        await HotPathCacheEviction.RemoveRunAsync(_hotPathReadCache, scope, run.RunId, ct);
        await HotPathCacheEviction.InvalidateRunListScopeAsync(_hotPathReadCache, scope, ct);
    }

    /// <inheritdoc />
    public async Task UpdateAsync(
        RunRecord run,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        await _inner.UpdateAsync(run, ct, connection, transaction);

        ScopeContext scope = ScopeForRun(run);
        await HotPathCacheEviction.RemoveRunAsync(_hotPathReadCache, scope, run.RunId, ct);
        await HotPathCacheEviction.InvalidateRunListScopeAsync(_hotPathReadCache, scope, ct);
    }

    /// <inheritdoc />
    public async Task<bool> TrySetOperatorGovernanceDispositionAsync(
        ScopeContext scope,
        Guid runId,
        string decision,
        string? rationale,
        string actorUserId,
        DateTime occurredUtc,
        CancellationToken ct)
    {
        bool updated = await _inner.TrySetOperatorGovernanceDispositionAsync(
            scope,
            runId,
            decision,
            rationale,
            actorUserId,
            occurredUtc,
            ct);

        if (updated)
        {
            await HotPathCacheEviction.RemoveRunAsync(_hotPathReadCache, scope, runId, ct);
            await HotPathCacheEviction.InvalidateRunListScopeAsync(_hotPathReadCache, scope, ct);
        }

        return updated;
    }

    private static ScopeContext ScopeForRun(RunRecord run)
    {
        return new ScopeContext { TenantId = run.TenantId, WorkspaceId = run.WorkspaceId, ProjectId = run.ScopeProjectId };
    }
}
