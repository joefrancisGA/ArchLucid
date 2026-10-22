using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

/// <summary>
///     Merges semantic objects from a prior committed package onto a new draft or run request (TB-2350).
/// </summary>
public interface IPriorPackageSemanticMergeService
{
    Task MergePriorPackageSemanticsAsync(
        ScopeContext scope,
        DraftRequestDocument document,
        string priorRunId,
        CancellationToken cancellationToken);

    Task MergePriorPackageSemanticsOntoRequestAsync(
        ScopeContext scope,
        ArchitectureRequest request,
        string priorRunId,
        CancellationToken cancellationToken);

    Task<PriorPackageSemanticCountsDto?> GetPriorPackageSemanticCountsAsync(
        ScopeContext scope,
        string priorRunId,
        CancellationToken cancellationToken);
}
