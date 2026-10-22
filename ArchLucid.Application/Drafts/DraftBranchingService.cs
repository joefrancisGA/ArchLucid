using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Drafts;

/// <inheritdoc cref="IDraftBranchingService" />
public sealed class DraftBranchingService(
    IDraftRequestRepository draftRepository,
    IDraftRequestCrudService crudService,
    IDraftAdmissionGate admissionGate,
    IDraftSemanticAdmissionEvaluator semanticAdmissionEvaluator,
    IQuestionSelectionEngine questionSelectionEngine,
    IOptionsMonitor<DraftIntakeBranchOptions> branchOptionsMonitor) : IDraftBranchingService
{
    private readonly IDraftAdmissionGate _admissionGate =
        admissionGate ?? throw new ArgumentNullException(nameof(admissionGate));

    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IDraftRequestCrudService _crudService =
        crudService ?? throw new ArgumentNullException(nameof(crudService));

    private readonly IDraftSemanticAdmissionEvaluator _semanticAdmissionEvaluator =
        semanticAdmissionEvaluator ?? throw new ArgumentNullException(nameof(semanticAdmissionEvaluator));

    private readonly IQuestionSelectionEngine _questionSelectionEngine =
        questionSelectionEngine ?? throw new ArgumentNullException(nameof(questionSelectionEngine));

    private readonly IOptionsMonitor<DraftIntakeBranchOptions> _branchOptionsMonitor =
        branchOptionsMonitor ?? throw new ArgumentNullException(nameof(branchOptionsMonitor));

    /// <inheritdoc />
    public async Task<BranchDraftResponse?> BranchAsync(
        ScopeContext scope,
        Guid parentDraftId,
        string actorUserId,
        BranchDraftRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorUserId);

        DraftRequestResponse? parent = await _crudService.GetAsync(scope, parentDraftId, cancellationToken);

        if (parent is null)
            return null;

        if (!DraftRequestStateMachine.AllowsBranch(parent.Status))
        {
            throw new InvalidOperationException(
                $"Draft '{parentDraftId}' cannot branch from status '{parent.Status}'.");
        }

        DraftIntakeBranchOptions branchOptions = _branchOptionsMonitor.CurrentValue;
        int existingBranches = await _draftRepository.CountChildBranchesAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            parentDraftId,
            cancellationToken);
        DraftBranchQuotaResponse quota = DraftIntakeBranchQuotaComposer.Compose(
            parentDraftId,
            existingBranches,
            branchOptions);

        if (!quota.CanBranch)
        {
            throw new InvalidOperationException(
                $"Draft '{parentDraftId}' reached the what-if branch cap ({quota.MaxBranchesPerParent} per parent draft).");
        }

        DraftRequestDocument branchDocument = DraftRequestDocumentCloner.Clone(parent.Document);
        branchDocument.ParentDraftId = parentDraftId;
        branchDocument.ConversationThreadId = null;

        DraftBranchOverrideApplicator.Apply(branchDocument, request);
        DraftDocumentMutator.SyncTransparencyFromDocument(branchDocument);

        if (request.OverrideKind == DraftBranchOverrideKind.QuestionAnswer
            && !string.IsNullOrWhiteSpace(request.OverrideKey))
        {
            DraftDocumentMutator.RecordAssertedAnswer(
                branchDocument,
                request.OverrideKey.Trim(),
                request.OverrideValue.Trim());
        }

        DraftRequestResponse branch = await _draftRepository.CreateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            actorUserId,
            branchDocument,
            cancellationToken);

        DraftAdmissionEvaluation evaluation = _admissionGate.Evaluate(branchDocument);

        if (evaluation.Admitted)
        {
            DraftAdmissionEvaluation? semanticRedirect =
                await DraftAdmissionResponseComposer.TrySemanticRedirectAsync(
                    _semanticAdmissionEvaluator,
                    branchDocument,
                    cancellationToken);

            if (semanticRedirect is null)
            {
                QuestionSelectionResult selection = await _questionSelectionEngine.SelectAsync(
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    branchDocument,
                    cancellationToken);

                branchDocument.RequiredMustQuestionKeys =
                    DraftAdmissionResponseComposer.ExtractAllMustQuestionKeys(selection);

                branch = await _draftRepository.UpdateAsync(
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    branch.DraftId,
                    DraftRequestStatus.Admitted,
                    branchDocument,
                    redirectReason: null,
                    spawnedRunId: null,
                    cancellationToken)
                    ?? branch;
            }
        }

        return new BranchDraftResponse
        {
            ParentDraftId = parentDraftId,
            ParentSpawnedRunId = parent.SpawnedRunId,
            Branch = branch,
        };
    }

    /// <inheritdoc />
    public async Task<DraftBranchQuotaResponse?> GetBranchQuotaAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DraftRequestResponse? existing = await _crudService.GetAsync(scope, draftId, cancellationToken);

        if (existing is null)
            return null;

        if (!DraftRequestStateMachine.AllowsBranch(existing.Status))
        {
            throw new InvalidOperationException(
                $"Draft '{draftId}' does not expose branch quota in status '{existing.Status}'.");
        }

        int existingBranches = await _draftRepository.CountChildBranchesAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            cancellationToken);

        return DraftIntakeBranchQuotaComposer.Compose(
            draftId,
            existingBranches,
            _branchOptionsMonitor.CurrentValue);
    }
}
