using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Drafts;

/// <summary>The existing linked-architecture, legacy-owner, and run-anchor rules for draft evidence.</summary>
public static class DraftResourceAccessPolicy
{
    public static async Task<HashSet<Guid>?> AuthorizeAsync(
        DraftRequestAccessMetadata facts, Guid draftId, ScopeContext scope, string actorId,
        Func<Guid, CancellationToken, Task<bool>> canAccessArchitecture,
        Func<Guid, CancellationToken, Task<bool>> canReadRun,
        CancellationToken cancellationToken)
    {
        if (facts.DraftId != draftId || facts.TenantId != scope.TenantId ||
            facts.WorkspaceId != scope.WorkspaceId || facts.ProjectId != scope.ProjectId)
            return null;

        if (facts.ArchitectureId is Guid architectureId)
        {
            if (architectureId == Guid.Empty || !await canAccessArchitecture(architectureId, cancellationToken))
                return null;
        }
        else if (!string.Equals(facts.CreatedByUserId, actorId, StringComparison.Ordinal))
        {
            // An unlinked draft has no share record; project scope alone grants no access.
            return null;
        }

        HashSet<Guid> runs = [];
        foreach (string? anchor in new[] { facts.PriorRunId, facts.SpawnedRunId })
        {
            if (string.IsNullOrWhiteSpace(anchor))
                continue;
            if (!Guid.TryParse(anchor, out Guid runId) || runId == Guid.Empty)
                return null;
            if (runs.Add(runId) && !await canReadRun(runId, cancellationToken))
                return null;
        }

        return runs;
    }
}
