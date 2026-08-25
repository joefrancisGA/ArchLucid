using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Shared run-repository rules used by SQL and in-memory <see cref="IRunRepository" /> implementations.
/// </summary>
internal static class RunRepositoryCore
{
    public const int MaxPurgeBatchSize = 10_000;

    public static void ValidateRunKeysetCursor(DateTime? cursorCreatedUtc, Guid? cursorRunId)
    {
        if (cursorCreatedUtc.HasValue != cursorRunId.HasValue)
            throw new ArgumentException(
                "Run keyset cursor requires both CreatedUtc and RunId together, or both omitted for the first page.");
    }

    public static string RequireArchitectureRequestId(string architectureRequestId)
    {
        if (string.IsNullOrWhiteSpace(architectureRequestId))
            throw new ArgumentException("Architecture request id is required.", nameof(architectureRequestId));

        return architectureRequestId.Trim();
    }

    public static string RequireSystemName(string systemName)
    {
        if (string.IsNullOrWhiteSpace(systemName))
            throw new ArgumentException("System name is required.", nameof(systemName));

        return systemName.Trim();
    }

    public static void ValidateOperatorGovernanceDispositionArgs(Guid runId, string decision, string actorUserId)
    {
        if (runId == Guid.Empty)
            throw new ArgumentException("Run id is required.", nameof(runId));

        if (string.IsNullOrWhiteSpace(decision))
            throw new ArgumentException("Decision is required.", nameof(decision));

        if (string.IsNullOrWhiteSpace(actorUserId))
            throw new ArgumentException("Actor user id is required.", nameof(actorUserId));
    }

    public static int ClampPurgeBatchSize(int batchSize)
    {
        if (batchSize < 1)
            throw new ArgumentOutOfRangeException(nameof(batchSize), batchSize, "Batch size must be at least 1.");

        return Math.Clamp(batchSize, 1, MaxPurgeBatchSize);
    }

    public static bool ShouldConsumeTrialRunAllowanceOnCreate(RunRecord run)
    {
        ArgumentNullException.ThrowIfNull(run);

        return TrialRunQuota.ShouldConsumeAllowanceOnCreate(
            run.IsSample,
            run.IsDemoWelcomeRun,
            run.ArchitectureRequestId);
    }

    public static bool MatchesScope(RunRecord run, ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(scope);

        return run.TenantId == scope.TenantId
               && run.WorkspaceId == scope.WorkspaceId
               && run.ScopeProjectId == scope.ProjectId;
    }

    public static bool MatchesWorkspace(RunRecord run, ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(scope);

        return run.TenantId == scope.TenantId && run.WorkspaceId == scope.WorkspaceId;
    }

    public static bool IsActiveInScope(RunRecord run, ScopeContext scope) =>
        MatchesScope(run, scope) && !run.ArchivedUtc.HasValue;

    public static bool AuthorityProjectSlugMatches(string? storedProjectId, string authorityProjectSlug)
    {
        if (string.IsNullOrWhiteSpace(storedProjectId))
            return false;

        return string.Equals(
            storedProjectId.Trim(),
            authorityProjectSlug.Trim(),
            StringComparison.OrdinalIgnoreCase);
    }

    public static bool MatchesProjectListFilter(RunRecord run, string projectSlug)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(projectSlug);

        if (AuthorityProjectSlugMatches(run.ProjectId, projectSlug))
            return true;

        if (Guid.TryParse(projectSlug, out Guid scopeProjectId) && run.ScopeProjectId == scopeProjectId)
            return true;

        return false;
    }

    public static bool IsCommittedRun(RunRecord run)
    {
        ArgumentNullException.ThrowIfNull(run);

        if (string.Equals(run.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return true;

        if (!string.IsNullOrWhiteSpace(run.CurrentManifestVersion))
            return true;

        return run.GoldenManifestId.HasValue;
    }

    public static bool LegacyRunStatusIsNonTerminal(string? legacyRunStatus)
    {
        // Null/empty statuses are treated as active — safer than falsely releasing lifecycle while status is uninitialized.
        if (string.IsNullOrWhiteSpace(legacyRunStatus))
            return true;

        if (string.Equals(legacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return false;

        if (string.Equals(legacyRunStatus, nameof(ArchitectureRunStatus.Failed), StringComparison.OrdinalIgnoreCase))
            return false;

        return !string.Equals(
            legacyRunStatus,
            nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected),
            StringComparison.OrdinalIgnoreCase);
    }

    public static ArchivedRunScopeRow ToArchivedRunScopeRow(RunRecord run)
    {
        ArgumentNullException.ThrowIfNull(run);

        return new ArchivedRunScopeRow
        {
            RunId = run.RunId,
            TenantId = run.TenantId,
            WorkspaceId = run.WorkspaceId,
            ScopeProjectId = run.ScopeProjectId,
        };
    }

    public static bool IsEligibleForCreatedBeforeArchive(RunRecord run, DateTime cutoffUtc, ScopeContext? scope) =>
        !run.ArchivedUtc.HasValue
        && run.CreatedUtc < cutoffUtc
        && (scope is null || MatchesScope(run, scope));

    public static bool IsEligibleForStaleUncommittedPurge(RunRecord run, DateTime cutoffUtc) =>
        run.CreatedUtc < cutoffUtc
        && !run.IsDemoWelcomeRun
        && !run.IsPublicShowcase
        && (string.IsNullOrWhiteSpace(run.LegacyRunStatus)
            || !string.Equals(
                run.LegacyRunStatus,
                nameof(ArchitectureRunStatus.Committed),
                StringComparison.OrdinalIgnoreCase));

    public static bool IsEligibleForSamplePurge(RunRecord run, Guid? tenantId, DateTime? cutoffUtc) =>
        run.IsSample
        && (!tenantId.HasValue || run.TenantId == tenantId.Value)
        && (!cutoffUtc.HasValue || run.CreatedUtc < cutoffUtc.Value);

    public static RunRecord? SelectLatestWithGraphAtOrBefore(
        IEnumerable<RunRecord> candidates,
        ScopeContext scope,
        string authorityProjectSlug,
        DateTime asOfUtc)
    {
        ArgumentNullException.ThrowIfNull(candidates);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityProjectSlug);

        RunRecord? best = null;

        foreach (RunRecord candidate in candidates)
        {
            if (!IsActiveInScope(candidate, scope))
                continue;

            if (!AuthorityProjectSlugMatches(candidate.ProjectId, authorityProjectSlug))
                continue;

            if (!candidate.GraphSnapshotId.HasValue)
                continue;

            if (candidate.CreatedUtc > asOfUtc)
                continue;

            if (best is null
                || candidate.CreatedUtc > best.CreatedUtc
                || (candidate.CreatedUtc == best.CreatedUtc && candidate.RunId.CompareTo(best.RunId) > 0))
                best = candidate;
        }

        return best;
    }

    public static Guid? SelectLatestCommittedRunIdByManifestCreatedUtc(
        IEnumerable<RunRecord> candidates,
        ScopeContext scope,
        string projectId)
    {
        ArgumentNullException.ThrowIfNull(candidates);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(projectId);

        Guid? bestRunId = null;
        DateTime? bestUtc = null;

        foreach (RunRecord candidate in candidates)
        {
            if (!IsActiveCommittedRunInProject(candidate, scope, projectId))
                continue;

            // In-memory has no GoldenManifests join; CompletedUtc is the commit-time stand-in.
            DateTime orderUtc = candidate.CompletedUtc ?? candidate.CreatedUtc;

            if (bestUtc is not null
                && (orderUtc < bestUtc.Value
                    || (orderUtc == bestUtc.Value && candidate.RunId.CompareTo(bestRunId!.Value) <= 0)))
                continue;

            bestUtc = orderUtc;
            bestRunId = candidate.RunId;
        }

        return bestRunId;
    }

    public static Guid? SelectPriorCommittedRunIdBeforeCurrent(
        IEnumerable<RunRecord> candidates,
        ScopeContext scope,
        string projectId,
        Guid currentRunId,
        DateTime currentCreatedUtc)
    {
        ArgumentNullException.ThrowIfNull(candidates);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(projectId);

        RunRecord? best = null;

        foreach (RunRecord candidate in candidates)
        {
            if (!IsActiveCommittedRunInProject(candidate, scope, projectId))
                continue;

            if (candidate.RunId == currentRunId)
                continue;

            if (candidate.CreatedUtc > currentCreatedUtc)
                continue;

            if (candidate.CreatedUtc == currentCreatedUtc && candidate.RunId >= currentRunId)
                continue;

            if (best is not null)
            {
                if (candidate.CreatedUtc < best.CreatedUtc)
                    continue;

                if (candidate.CreatedUtc == best.CreatedUtc && candidate.RunId <= best.RunId)
                    continue;
            }

            best = candidate;
        }

        return best?.RunId;
    }

    public static Guid? SelectPriorCommittedRunIdForArchitectureBeforeCurrent(
        IEnumerable<RunRecord> candidates,
        ScopeContext scope,
        Guid architectureId,
        Guid currentRunId,
        DateTime currentCreatedUtc)
    {
        ArgumentNullException.ThrowIfNull(candidates);
        ArgumentNullException.ThrowIfNull(scope);

        if (architectureId == Guid.Empty)
            return null;

        RunRecord? best = null;

        foreach (RunRecord candidate in candidates)
        {
            if (!IsActiveInScope(candidate, scope))
                continue;

            if (candidate.ArchitectureId != architectureId)
                continue;

            if (candidate.RunId == currentRunId)
                continue;

            if (!candidate.GoldenManifestId.HasValue || !IsCommittedRun(candidate))
                continue;

            if (candidate.CreatedUtc > currentCreatedUtc)
                continue;

            if (candidate.CreatedUtc == currentCreatedUtc && candidate.RunId >= currentRunId)
                continue;

            if (best is not null)
            {
                if (candidate.CreatedUtc < best.CreatedUtc)
                    continue;

                if (candidate.CreatedUtc == best.CreatedUtc && candidate.RunId <= best.RunId)
                    continue;
            }

            best = candidate;
        }

        return best?.RunId;
    }

    public static Guid? SelectCommittedRunIdByGoldenManifestId(
        IEnumerable<RunRecord> candidates,
        ScopeContext scope,
        Guid architectureId,
        Guid goldenManifestId,
        Guid excludeRunId)
    {
        ArgumentNullException.ThrowIfNull(candidates);
        ArgumentNullException.ThrowIfNull(scope);

        if (architectureId == Guid.Empty || goldenManifestId == Guid.Empty)
            return null;

        foreach (RunRecord candidate in candidates)
        {
            if (!IsActiveInScope(candidate, scope))
                continue;

            if (candidate.ArchitectureId != architectureId)
                continue;

            if (candidate.GoldenManifestId != goldenManifestId)
                continue;

            if (candidate.RunId == excludeRunId)
                continue;

            if (!IsCommittedRun(candidate))
                continue;

            return candidate.RunId;
        }

        return null;
    }

    private static bool IsActiveCommittedRunInProject(RunRecord candidate, ScopeContext scope, string projectId) =>
        IsActiveInScope(candidate, scope)
        && AuthorityProjectSlugMatches(candidate.ProjectId, projectId)
        && candidate.GoldenManifestId.HasValue
        && IsCommittedRun(candidate);
}
