using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

/// <summary>
///     Merges semantic objects from a prior committed package onto a new draft (TB-2350).
/// </summary>
public interface IPriorPackageSemanticMergeService
{
    Task MergePriorPackageSemanticsAsync(
        ScopeContext scope,
        DraftRequestDocument document,
        string priorRunId,
        CancellationToken cancellationToken);
}
