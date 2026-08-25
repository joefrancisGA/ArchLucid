using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class InMemoryRunRepository
{

    public Task<RunRecord?> GetByIdAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (!_store.TryGetValue(runId, out RunRecord? r) || !RunRepositoryCore.IsActiveInScope(r, scope))
            return Task.FromResult<RunRecord?>(null);

        return Task.FromResult<RunRecord?>(r);
    }

    public Task<RunRecord?> GetByIdIncludingArchivedAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (!_store.TryGetValue(runId, out RunRecord? r) || !RunRepositoryCore.MatchesScope(r, scope))
            return Task.FromResult<RunRecord?>(null);

        return Task.FromResult<RunRecord?>(r);
    }

    public Task<RunRecord?> GetByRunIdAdminAsync(Guid runId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (!_store.TryGetValue(runId, out RunRecord? r) || r.ArchivedUtc.HasValue)
            return Task.FromResult<RunRecord?>(null);

        return Task.FromResult<RunRecord?>(r);
    }

    public Task<RunRecord?> GetLatestWithGraphAtOrBeforeAsync(
        ScopeContext scope,
        string authorityProjectSlug,
        DateTime asOfUtc,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        return Task.FromResult(
            RunRepositoryCore.SelectLatestWithGraphAtOrBefore(_store.Values, scope, authorityProjectSlug, asOfUtc));
    }

    /// <inheritdoc />
    public Task<Guid?> GetLatestCommittedRunIdByManifestCreatedUtcAsync(
        ScopeContext scope,
        string projectId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(projectId);

        return Task.FromResult(
            RunRepositoryCore.SelectLatestCommittedRunIdByManifestCreatedUtc(_store.Values, scope, projectId));
    }

    /// <inheritdoc />
    public Task<Guid?> GetPriorCommittedRunIdBeforeCurrentAsync(
        ScopeContext scope,
        string projectId,
        Guid currentRunId,
        DateTime currentCreatedUtc,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(projectId);

        return Task.FromResult(
            RunRepositoryCore.SelectPriorCommittedRunIdBeforeCurrent(
                _store.Values,
                scope,
                projectId,
                currentRunId,
                currentCreatedUtc));
    }

    public Task<Guid?> GetPriorCommittedRunIdForArchitectureBeforeCurrentAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid currentRunId,
        DateTime currentCreatedUtc,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);

        return Task.FromResult(
            RunRepositoryCore.SelectPriorCommittedRunIdForArchitectureBeforeCurrent(
                _store.Values,
                scope,
                architectureId,
                currentRunId,
                currentCreatedUtc));
    }

    public Task<Guid?> GetCommittedRunIdByGoldenManifestIdAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid goldenManifestId,
        Guid excludeRunId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);

        return Task.FromResult(
            RunRepositoryCore.SelectCommittedRunIdByGoldenManifestId(
                _store.Values,
                scope,
                architectureId,
                goldenManifestId,
                excludeRunId));
    }

    public Task ClearGraphSnapshotForArchitectureAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);

        if (architectureId == Guid.Empty)
            return Task.CompletedTask;

        foreach (RunRecord candidate in _store.Values)
        {
            if (!RunRepositoryCore.IsActiveInScope(candidate, scope))
                continue;

            if (candidate.ArchitectureId != architectureId)
                continue;

            candidate.GraphSnapshotId = null;
        }

        return Task.CompletedTask;
    }

    public Task<Guid?> GetLatestRunIdForArchitectureAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);

        if (architectureId == Guid.Empty)
            return Task.FromResult<Guid?>(null);

        RunRecord? latest = _store.Values
            .Where(run =>
                RunRepositoryCore.IsActiveInScope(run, scope)
                && run.ArchitectureId == architectureId)
            .OrderByDescending(run => run.CreatedUtc)
            .ThenByDescending(run => run.RunId)
            .FirstOrDefault();

        return Task.FromResult(latest?.RunId);
    }

    /// <inheritdoc />
    public Task<int> CountActiveRunsForArchitectureRequestAsync(
        ScopeContext scope,
        string architectureRequestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();

        string key = RunRepositoryCore.RequireArchitectureRequestId(architectureRequestId);

        List<RunRecord> matches =
        [
            .. _store.Values.Where(r =>
                RunRepositoryCore.IsActiveInScope(r, scope) &&
                string.Equals(r.ArchitectureRequestId, key, StringComparison.OrdinalIgnoreCase)),
        ];

        return Task.FromResult(matches.Count(r => RunRepositoryCore.LegacyRunStatusIsNonTerminal(r.LegacyRunStatus)));
    }

    /// <inheritdoc />
    public Task<bool> ExistsRunForArchitectureRequestInScopeAsync(
        ScopeContext scope,
        string architectureRequestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();

        string key = RunRepositoryCore.RequireArchitectureRequestId(architectureRequestId);

        bool exists = _store.Values.Any(r =>
            RunRepositoryCore.MatchesScope(r, scope) &&
            string.Equals(r.ArchitectureRequestId, key, StringComparison.OrdinalIgnoreCase));

        return Task.FromResult(exists);
    }

    /// <inheritdoc />
    public Task<bool> ExistsActiveRunWithSystemNameInWorkspaceAsync(
        ScopeContext scope,
        string systemName,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();

        string normalizedName = RunRepositoryCore.RequireSystemName(systemName).ToUpperInvariant();

        bool exists = _store.Values.Any(r =>
            RunRepositoryCore.MatchesWorkspace(r, scope) &&
            !r.ArchivedUtc.HasValue &&
            string.Equals(r.ProjectId.Trim(), normalizedName, StringComparison.OrdinalIgnoreCase));

        return Task.FromResult(exists);
    }
}
