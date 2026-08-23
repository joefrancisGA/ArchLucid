using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

/// <summary>Create, read, patch, Q&amp;A, abandon, and reopen draft requests.</summary>
public interface IDraftRequestCrudService
{
    Task<DraftRequestResponse> CreateAsync(
        ScopeContext scope,
        string actorUserId,
        CreateDraftRequest request,
        CancellationToken cancellationToken);

    Task<DraftRequestResponse?> GetAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken);

    Task<DraftRequestResponse?> PatchAsync(
        ScopeContext scope,
        Guid draftId,
        PatchDraftRequest patch,
        CancellationToken cancellationToken);

    Task<DraftRequestResponse?> AnswerQuestionAsync(
        ScopeContext scope,
        Guid draftId,
        AnswerDraftQuestionRequest request,
        CancellationToken cancellationToken);

    Task<DraftRequestResponse?> SkipQuestionAsync(
        ScopeContext scope,
        Guid draftId,
        SkipDraftQuestionRequest request,
        CancellationToken cancellationToken);

    Task<DraftRequestResponse?> AbandonAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken);

    Task<DraftRequestResponse?> ReopenAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken);
}
