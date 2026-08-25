using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

/// <summary>Prevents duplicate review/architecture names within a workspace.</summary>
public interface IWorkspaceSystemNameCollisionGuard
{
    /// <summary>
    ///     Throws <see cref="ConflictException" /> when <paramref name="systemName" /> is already used by an active
    ///     review run or mutable intake draft in <paramref name="scope" />'s workspace.
    /// </summary>
    /// <param name="excludeDraftId">Optional draft to ignore (for in-place renames).</param>
    /// <param name="excludeRunId">Optional run to ignore (async create completing its own admitted stub).</param>
    Task EnsureAvailableAsync(
        ScopeContext scope,
        string systemName,
        Guid? excludeDraftId = null,
        Guid? excludeRunId = null,
        CancellationToken cancellationToken = default);
}
