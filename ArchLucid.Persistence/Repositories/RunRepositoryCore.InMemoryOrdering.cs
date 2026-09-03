using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

internal static partial class RunRepositoryCore
{
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

    public static Guid? SelectLatestCommittedRunIdByArchitectureVersionId(
        IEnumerable<RunRecord> candidates,
        ScopeContext scope,
        Guid architectureVersionId)
    {
        ArgumentNullException.ThrowIfNull(candidates);
        ArgumentNullException.ThrowIfNull(scope);

        if (architectureVersionId == Guid.Empty)
            return null;

        RunRecord? best = null;

        foreach (RunRecord candidate in candidates)
        {
            if (!IsActiveInScope(candidate, scope))
                continue;

            if (candidate.ArchitectureVersionId != architectureVersionId)
                continue;

            if (!IsCommittedRun(candidate))
                continue;

            if (best is null
                || candidate.CreatedUtc > best.CreatedUtc
                || (candidate.CreatedUtc == best.CreatedUtc && candidate.RunId.CompareTo(best.RunId) > 0))
            {
                best = candidate;
            }
        }

        return best?.RunId;
    }
}
