using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

internal static partial class RunRepositoryCore
{
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

    /// <summary>
    ///     Returns whether a non-archived run occupies a workspace system name for duplicate checks.
    ///     Terminal <see cref="ArchitectureRunStatus.Failed" /> and
    ///     <see cref="ArchitectureRunStatus.ExecutionCompletedQualityRejected" /> runs do not occupy.
    /// </summary>
    public static bool OccupiesWorkspaceSystemName(RunRecord run, Guid? excludeRunId = null)
    {
        ArgumentNullException.ThrowIfNull(run);

        if (run.ArchivedUtc.HasValue)
            return false;

        if (excludeRunId.HasValue && run.RunId == excludeRunId.Value)
            return false;

        if (string.Equals(run.LegacyRunStatus, nameof(ArchitectureRunStatus.Failed), StringComparison.OrdinalIgnoreCase))
            return false;

        if (string.Equals(
                run.LegacyRunStatus,
                nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected),
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return true;
    }

    internal static bool IsActiveCommittedRunInProject(RunRecord candidate, ScopeContext scope, string projectId) =>
        IsActiveInScope(candidate, scope)
        && AuthorityProjectSlugMatches(candidate.ProjectId, projectId)
        && candidate.GoldenManifestId.HasValue
        && IsCommittedRun(candidate);
}
