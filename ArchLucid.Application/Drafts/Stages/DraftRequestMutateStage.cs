using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Drafts.Stages;

/// <inheritdoc cref="IDraftRequestMutateStage" />
public sealed class DraftRequestMutateStage(
    IDraftRequestRepository draftRepository,
    IQuestionSelectionEngine questionSelectionEngine,
    IWorkspaceSystemNameCollisionGuard workspaceSystemNameCollisionGuard) : IDraftRequestMutateStage
{
    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IQuestionSelectionEngine _questionSelectionEngine =
        questionSelectionEngine ?? throw new ArgumentNullException(nameof(questionSelectionEngine));

    private readonly IWorkspaceSystemNameCollisionGuard _workspaceSystemNameCollisionGuard =
        workspaceSystemNameCollisionGuard ?? throw new ArgumentNullException(nameof(workspaceSystemNameCollisionGuard));

    public async Task<DraftRequestResponse?> PatchAsync(
        ScopeContext scope,
        Guid draftId,
        PatchDraftRequest patch,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(patch);

        DraftRequestResponse? existing = await GetAsync(scope, draftId, cancellationToken);

        if (existing is null)
            return null;

        if (!DraftRequestStateMachine.IsMutable(existing.Status))
            throw new InvalidOperationException($"Draft '{draftId}' is not mutable in status '{existing.Status}'.");

        DraftPatchStaleUpdatedUtcGuard.EnsurePatchNotStaleOrThrow(
            existing,
            patch.ExpectedUpdatedUtc,
            patch.ForceOverwrite == true);

        if (patch.SystemName is not null && !string.IsNullOrWhiteSpace(patch.SystemName))
        {
            string trimmedName = patch.SystemName.Trim();
            string? existingNormalized = WorkspaceSystemNameNormalizer.NormalizeOrNull(existing.Document.SystemName);
            string? proposedNormalized = WorkspaceSystemNameNormalizer.NormalizeOrNull(trimmedName);

            if (proposedNormalized is not null
                && !string.Equals(existingNormalized, proposedNormalized, StringComparison.Ordinal))
            {
                Guid? excludeRunId = ArchitectureReviewSourceRunResolver.TryParseRunGuid(existing.Document.PriorRunId);

                await _workspaceSystemNameCollisionGuard
                    .EnsureAvailableAsync(
                        scope,
                        trimmedName,
                        WorkspaceSystemNameOccupancyKind.Architecture,
                        excludeDraftId: draftId,
                        excludeRunId: excludeRunId,
                        cancellationToken: cancellationToken)
                    .ConfigureAwait(false);
            }
        }

        DraftDocumentMutator.ApplyPatch(existing.Document, patch);
        DraftDocumentMutator.SyncTransparencyFromDocument(existing.Document);

        return await _draftRepository.UpdateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            existing.Status,
            existing.Document,
            existing.RedirectReason,
            existing.SpawnedRunId,
            cancellationToken);
    }

    public async Task<DraftRequestResponse?> AnswerQuestionAsync(
        ScopeContext scope,
        Guid draftId,
        AnswerDraftQuestionRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.QuestionKey))
            throw new InvalidOperationException("QuestionKey is required.");

        if (string.IsNullOrWhiteSpace(request.Answer))
            throw new InvalidOperationException("Answer is required.");

        DraftRequestResponse? existing = await GetAsync(scope, draftId, cancellationToken);

        if (existing is null)
            return null;

        if (!DraftRequestStateMachine.AllowsQuestionAnswers(existing.Status))
            throw new InvalidOperationException(
                $"Draft '{draftId}' does not accept answers in status '{existing.Status}'.");

        existing.Document.QuestionAnswers[request.QuestionKey.Trim()] = request.Answer.Trim();
        DraftDocumentMutator.RemoveSkippedQuestion(existing.Document, request.QuestionKey.Trim());
        DraftDocumentMutator.RecordAssertedAnswer(existing.Document, request.QuestionKey.Trim(), request.Answer.Trim());

        return await _draftRepository.UpdateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            existing.Status,
            existing.Document,
            existing.RedirectReason,
            existing.SpawnedRunId,
            cancellationToken);
    }

    public async Task<DraftRequestResponse?> SkipQuestionAsync(
        ScopeContext scope,
        Guid draftId,
        SkipDraftQuestionRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.QuestionKey))
            throw new InvalidOperationException("QuestionKey is required.");

        string questionKey = request.QuestionKey.Trim();

        DraftRequestResponse? existing = await GetAsync(scope, draftId, cancellationToken);

        if (existing is null)
            return null;

        if (!DraftRequestStateMachine.AllowsQuestionAnswers(existing.Status))
            throw new InvalidOperationException(
                $"Draft '{draftId}' does not accept skips in status '{existing.Status}'.");

        QuestionSelectionResult selection = await _questionSelectionEngine.SelectAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            existing.Document,
            cancellationToken);

        DraftElicitationQuestion? question = selection.AllQuestions
            .FirstOrDefault(candidate =>
                string.Equals(candidate.QuestionKey, questionKey, StringComparison.OrdinalIgnoreCase));

        if (question is null)
            throw new InvalidOperationException($"Question '{questionKey}' is not part of the current selection.");

        existing.Document.QuestionAnswers.Remove(questionKey);
        DraftDocumentMutator.UpsertSkipped(existing.Document, questionKey, question.Tier);

        return await _draftRepository.UpdateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            existing.Status,
            existing.Document,
            existing.RedirectReason,
            existing.SpawnedRunId,
            cancellationToken);
    }

    public async Task<DraftRequestResponse?> ReopenAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DraftRequestResponse? existing = await GetAsync(scope, draftId, cancellationToken);

        if (existing is null)
            return null;

        if (!DraftRequestStateMachine.AllowsReopen(existing.Status))
            throw new InvalidOperationException($"Draft '{draftId}' cannot be reopened from status '{existing.Status}'.");

        return await _draftRepository.UpdateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            DraftRequestStatus.Drafting,
            existing.Document,
            existing.RedirectReason,
            existing.SpawnedRunId,
            cancellationToken);
    }

    private Task<DraftRequestResponse?> GetAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken) =>
        _draftRepository.GetAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, draftId, cancellationToken);
}
