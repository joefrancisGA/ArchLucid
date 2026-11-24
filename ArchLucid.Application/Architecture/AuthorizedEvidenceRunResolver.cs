using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Architecture;

/// <summary>Enumerates candidate run IDs; the caller supplies the existing resource authorization decision.</summary>
public static class AuthorizedEvidenceRunResolver
{
    // Fail closed rather than silently broaden or truncate a project search.
    private const int MaxAuthorizationPages = 5;

    public static async Task<HashSet<Guid>?> ResolveProjectAsync(
        IRunRepository runs, ScopeContext scope,
        Func<Guid, CancellationToken, Task<bool>> canRead, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(runs);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(canRead);

        HashSet<Guid> allowed = [];
        HashSet<Guid> visited = [];
        DateTime? cursorCreatedUtc = null;
        Guid? cursorRunId = null;

        for (int pageNumber = 0; pageNumber < MaxAuthorizationPages; pageNumber++)
        {
            RunListPage page = await runs.ListRecentInScopeKeysetAsync(
                scope, cursorCreatedUtc, cursorRunId, RunPagination.MaxTake, ct);

            foreach (RunRecord candidate in page.Items)
            {
                ct.ThrowIfCancellationRequested();
                if (candidate.RunId == Guid.Empty || !visited.Add(candidate.RunId))
                    continue;

                if (await canRead(candidate.RunId, ct))
                    allowed.Add(candidate.RunId);
            }

            if (!page.HasMore)
                return allowed;

            if (page.Items.Count == 0)
                break;

            RunRecord last = page.Items[^1];
            if (last.RunId == Guid.Empty ||
                (cursorCreatedUtc == last.CreatedUtc && cursorRunId == last.RunId))
                break;

            cursorCreatedUtc = last.CreatedUtc;
            cursorRunId = last.RunId;
        }

        return null;
    }
}
