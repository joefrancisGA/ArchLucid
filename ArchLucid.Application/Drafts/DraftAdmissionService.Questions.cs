using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

public sealed partial class DraftAdmissionService
{
    /// <inheritdoc />
    public Task<DraftQuestionsResponse?> GetQuestionsAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken) =>
        GetQuestionsAsync(scope, draftId, authorizedUpdatedUtc: null, cancellationToken);

    public async Task<DraftQuestionsResponse?> GetQuestionsAsync(ScopeContext scope, Guid draftId,
        DateTime? authorizedUpdatedUtc, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DraftRequestResponse? existing = authorizedUpdatedUtc is DateTime revision
            ? await _draftRepository.GetAtAccessRevisionAsync(
                scope.TenantId, scope.WorkspaceId, scope.ProjectId, draftId, revision, cancellationToken)
            : await _crudService.GetAsync(scope, draftId, cancellationToken);

        if (existing is null)
            return null;

        if (!DraftRequestStateMachine.AllowsQuestionSelectionRead(existing.Status))
        {
            throw new InvalidOperationException(
                $"Draft '{draftId}' does not expose questions in status '{existing.Status}'.");
        }

        QuestionSelectionResult selection = await _questionSelectionEngine.SelectAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            existing.Document,
            cancellationToken);

        return new DraftQuestionsResponse
        {
            DraftId = draftId,
            Status = existing.Status,
            Selection = selection,
        };
    }
}
