using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

/// <summary>Orchestrates the mutable draft-request lifecycle (ADR 0048).</summary>
public interface IDraftRequestService
{
    Task<DraftRequestResponse> CreateAsync(ScopeContext scope, string actorUserId, CreateDraftRequest request,
        CancellationToken cancellationToken);

    Task<DraftRequestResponse?> GetAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken);

    Task<DraftRequestResponse?> PatchAsync(ScopeContext scope, Guid draftId, PatchDraftRequest patch,
        CancellationToken cancellationToken);

    Task<DraftRequestResponse?> AnswerQuestionAsync(ScopeContext scope, Guid draftId,
        AnswerDraftQuestionRequest request, CancellationToken cancellationToken);

    Task<DraftRequestResponse?> SkipQuestionAsync(ScopeContext scope, Guid draftId,
        SkipDraftQuestionRequest request, CancellationToken cancellationToken);

    Task<DraftAdmissionResponse?> RequestAdmissionAsync(ScopeContext scope, Guid draftId,
        CancellationToken cancellationToken);

    Task<DraftQuestionsResponse?> GetQuestionsAsync(ScopeContext scope, Guid draftId,
        CancellationToken cancellationToken);

    Task<SubmitDraftResponse?> SubmitAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken);

    Task<DraftRequestResponse?> AbandonAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken);

    Task<BranchDraftResponse?> BranchAsync(ScopeContext scope, Guid parentDraftId, string actorUserId,
        BranchDraftRequest request, CancellationToken cancellationToken);

    Task<DraftBranchQuotaResponse?> GetBranchQuotaAsync(ScopeContext scope, Guid draftId,
        CancellationToken cancellationToken);
}
