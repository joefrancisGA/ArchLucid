using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Drafts;

/// <inheritdoc cref="IDraftRequestCrudService" />
public sealed class DraftRequestCrudService(
    IDraftRequestRepository draftRepository,
    IQuestionSelectionEngine questionSelectionEngine,
    IPriorPackageSemanticMergeService priorPackageSemanticMergeService,
    IWorkspaceSystemNameCollisionGuard workspaceSystemNameCollisionGuard) : IDraftRequestCrudService
{
    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IQuestionSelectionEngine _questionSelectionEngine =
        questionSelectionEngine ?? throw new ArgumentNullException(nameof(questionSelectionEngine));

    private readonly IPriorPackageSemanticMergeService _priorPackageSemanticMergeService =
        priorPackageSemanticMergeService
        ?? throw new ArgumentNullException(nameof(priorPackageSemanticMergeService));

    private readonly IWorkspaceSystemNameCollisionGuard _workspaceSystemNameCollisionGuard =
        workspaceSystemNameCollisionGuard ?? throw new ArgumentNullException(nameof(workspaceSystemNameCollisionGuard));

    /// <inheritdoc />
    public async Task<DraftRequestResponse> CreateAsync(
        ScopeContext scope,
        string actorUserId,
        CreateDraftRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorUserId);

        string intent = request.FreeTextIntent.Trim();

        if (intent.Length < DraftIntakeValidation.MinimumFreeTextIntentLength)
            throw new InvalidOperationException(
                $"FreeTextIntent must be at least {DraftIntakeValidation.MinimumFreeTextIntentLength} characters after trim.");

        if (intent.Length > DraftIntakeValidation.MaximumFreeTextIntentLength)
            throw new InvalidOperationException(
                $"FreeTextIntent must not exceed {DraftIntakeValidation.MaximumFreeTextIntentLength} characters after trim.");

        DraftRequestDocument document = new()
        {
            FreeTextIntent = intent,
            FocusedPilotModeEnabled = true,
            WorkflowIntent = DraftDocumentMutator.NormalizeWorkflowIntent(request.WorkflowIntent),
            PriorRunId = string.IsNullOrWhiteSpace(request.PriorRunId) ? null : request.PriorRunId.Trim(),
        };

        if (!string.IsNullOrWhiteSpace(document.PriorRunId))
        {
            await _priorPackageSemanticMergeService.MergePriorPackageSemanticsAsync(
                scope,
                document,
                document.PriorRunId,
                cancellationToken);
        }

        return await _draftRepository.CreateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            actorUserId,
            document,
            cancellationToken);
    }

    /// <inheritdoc />
    public Task<DraftRequestResponse?> GetAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _draftRepository.GetAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, draftId, cancellationToken);
    }

    /// <inheritdoc />
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

        if (patch.SystemName is not null && !string.IsNullOrWhiteSpace(patch.SystemName))
        {
            string trimmedName = patch.SystemName.Trim();
            string? existingNormalized = WorkspaceSystemNameNormalizer.NormalizeOrNull(existing.Document.SystemName);
            string? proposedNormalized = WorkspaceSystemNameNormalizer.NormalizeOrNull(trimmedName);

            if (proposedNormalized is not null
                && !string.Equals(existingNormalized, proposedNormalized, StringComparison.Ordinal))
            {
                await _workspaceSystemNameCollisionGuard
                    .EnsureAvailableAsync(scope, trimmedName, excludeDraftId: draftId, cancellationToken: cancellationToken)
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

    /// <inheritdoc />
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

    /// <inheritdoc />
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

    /// <inheritdoc />
    public async Task<DraftRequestResponse?> AbandonAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DraftRequestResponse? existing = await GetAsync(scope, draftId, cancellationToken);

        if (existing is null)
            return null;

        if (!DraftRequestStateMachine.AllowsAbandon(existing.Status))
            throw new InvalidOperationException($"Draft '{draftId}' cannot be abandoned from status '{existing.Status}'.");

        return await _draftRepository.UpdateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            DraftRequestStatus.Abandoned,
            existing.Document,
            existing.RedirectReason,
            existing.SpawnedRunId,
            cancellationToken);
    }

    /// <inheritdoc />
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
}
