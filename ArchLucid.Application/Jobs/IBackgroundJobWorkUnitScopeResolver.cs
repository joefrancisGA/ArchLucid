using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Jobs;

/// <summary>
///     Derives tenant/workspace/project scope from a serialized background job work unit before worker execution.
/// </summary>
public interface IBackgroundJobWorkUnitScopeResolver
{
    Task<ScopeContext> ResolveAsync(BackgroundJobWorkUnit workUnit, CancellationToken cancellationToken = default);
}
