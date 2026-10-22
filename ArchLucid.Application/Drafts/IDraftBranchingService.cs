using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

/// <summary>What-if branch creation and branch quota for admitted drafts.</summary>
public interface IDraftBranchingService
{
    Task<BranchDraftResponse?> BranchAsync(
        ScopeContext scope,
        Guid parentDraftId,
        string actorUserId,
        BranchDraftRequest request,
        CancellationToken cancellationToken);

    Task<DraftBranchQuotaResponse?> GetBranchQuotaAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken);
}
