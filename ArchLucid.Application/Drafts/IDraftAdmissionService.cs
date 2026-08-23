using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

/// <summary>Admission evaluation, guided questions, and submit-to-run orchestration.</summary>
public interface IDraftAdmissionService
{
    Task<DraftAdmissionResponse?> RequestAdmissionAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken);

    Task<DraftQuestionsResponse?> GetQuestionsAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken);

    Task<SubmitDraftResponse?> SubmitAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken);
}
