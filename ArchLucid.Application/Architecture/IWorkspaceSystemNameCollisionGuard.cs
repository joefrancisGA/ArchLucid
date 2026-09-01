using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

/// <summary>Prevents duplicate review/architecture names within a workspace.</summary>
public interface IWorkspaceSystemNameCollisionGuard
{
    /// <summary>
    ///     Throws <see cref="ConflictException" /> when <paramref name="systemName" /> is already used by an occupying
    ///     review run or mutable intake draft in <paramref name="scope" />'s workspace. Failed and quality-rejected
    ///     runs do not occupy; committed and in-flight runs do.
    /// </summary>
    /// <param name="excludeDraftId">Optional draft to ignore (for in-place renames).</param>
    /// <param name="excludeRunId">Optional run to ignore (async create stub or prior run on a replacement intake).</param>
    Task EnsureAvailableAsync(
        ScopeContext scope,
        string systemName,
        Guid? excludeDraftId = null,
        Guid? excludeRunId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Returns <see langword="false" /> when <paramref name="systemName" /> is already used by an occupying review run
    ///     or mutable intake draft in <paramref name="scope" />'s workspace. Empty names after trim are treated as
    ///     available.
    /// </summary>
    Task<bool> IsAvailableAsync(
        ScopeContext scope,
        string systemName,
        Guid? excludeDraftId = null,
        Guid? excludeRunId = null,
        CancellationToken cancellationToken = default);
}
