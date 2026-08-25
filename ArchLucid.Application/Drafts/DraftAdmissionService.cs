using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts.PriorAnswerReuse;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Drafts;

/// <inheritdoc cref="IDraftAdmissionService" />
public sealed class DraftAdmissionService(
    IDraftRequestRepository draftRepository,
    IDraftRequestCrudService crudService,
    IDraftAdmissionGate admissionGate,
    IDraftSemanticAdmissionEvaluator semanticAdmissionEvaluator,
    IQuestionSelectionEngine questionSelectionEngine,
    IDraftRequestProjector projector,
    IArchitectureRunCommandService architectureRunCommandService,
    IRequestContentSafetyPrecheck contentSafetyPrecheck,
    FeasibilityVerdictBuilder feasibilityVerdictBuilder,
    IWorkspaceSystemNameCollisionGuard workspaceSystemNameCollisionGuard) : IDraftAdmissionService
{
    private readonly IDraftAdmissionGate _admissionGate =
        admissionGate ?? throw new ArgumentNullException(nameof(admissionGate));

    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IDraftRequestCrudService _crudService =
        crudService ?? throw new ArgumentNullException(nameof(crudService));

    private readonly IDraftSemanticAdmissionEvaluator _semanticAdmissionEvaluator =
        semanticAdmissionEvaluator ?? throw new ArgumentNullException(nameof(semanticAdmissionEvaluator));

    private readonly IRequestContentSafetyPrecheck _contentSafetyPrecheck =
        contentSafetyPrecheck ?? throw new ArgumentNullException(nameof(contentSafetyPrecheck));

    private readonly IQuestionSelectionEngine _questionSelectionEngine =
        questionSelectionEngine ?? throw new ArgumentNullException(nameof(questionSelectionEngine));

    private readonly IDraftRequestProjector _projector =
        projector ?? throw new ArgumentNullException(nameof(projector));

    private readonly IArchitectureRunCommandService _architectureRunCommandService =
        architectureRunCommandService ?? throw new ArgumentNullException(nameof(architectureRunCommandService));

    private readonly FeasibilityVerdictBuilder _feasibilityVerdictBuilder =
        feasibilityVerdictBuilder ?? throw new ArgumentNullException(nameof(feasibilityVerdictBuilder));

    private readonly IWorkspaceSystemNameCollisionGuard _workspaceSystemNameCollisionGuard =
        workspaceSystemNameCollisionGuard ?? throw new ArgumentNullException(nameof(workspaceSystemNameCollisionGuard));

    /// <inheritdoc />
    public async Task<DraftAdmissionResponse?> RequestAdmissionAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DraftRequestResponse? existing = await _crudService.GetAsync(scope, draftId, cancellationToken);

        if (existing is null)
            return null;

        if (!DraftRequestStateMachine.AllowsAdmission(existing.Status))
            throw new InvalidOperationException(
                $"Draft '{draftId}' cannot request admission from status '{existing.Status}'.");

        ArchitectureRequest safetyProbe = _projector.Project(existing.Document, draftId);
        RequestContentSafetyResult safety =
            await _contentSafetyPrecheck.EvaluateAsync(safetyProbe, cancellationToken);

        if (!safety.IsAllowed)
        {
            string reason = string.Join("; ", safety.Reasons);

            DraftRequestResponse? redirected = await _draftRepository.UpdateAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                draftId,
                DraftRequestStatus.Redirected,
                existing.Document,
                reason,
                existing.SpawnedRunId,
                cancellationToken);

            return DraftAdmissionResponseComposer.BuildAdmissionResponse(
                _feasibilityVerdictBuilder,
                redirected!,
                admitted: false,
                reason);
        }

        DraftAdmissionEvaluation evaluation = _admissionGate.Evaluate(existing.Document);

        if (!evaluation.Admitted)
        {
            DraftRequestResponse? redirected = await _draftRepository.UpdateAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                draftId,
                DraftRequestStatus.Redirected,
                existing.Document,
                evaluation.RedirectReason,
                existing.SpawnedRunId,
                cancellationToken);

            return DraftAdmissionResponseComposer.BuildAdmissionResponse(
                _feasibilityVerdictBuilder,
                redirected!,
                admitted: false,
                evaluation.RedirectReason);
        }

        DraftAdmissionEvaluation? semanticRedirect =
            await DraftAdmissionResponseComposer.TrySemanticRedirectAsync(
                _semanticAdmissionEvaluator,
                existing.Document,
                cancellationToken);

        if (semanticRedirect is not null)
        {
            DraftRequestResponse? redirected = await _draftRepository.UpdateAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                draftId,
                DraftRequestStatus.Redirected,
                existing.Document,
                semanticRedirect.RedirectReason,
                existing.SpawnedRunId,
                cancellationToken);

            return DraftAdmissionResponseComposer.BuildAdmissionResponse(
                _feasibilityVerdictBuilder,
                redirected!,
                admitted: false,
                semanticRedirect.RedirectReason);
        }

        await ApplyPriorAnswerReuseAsync(scope, draftId, existing.Document, cancellationToken);

        QuestionSelectionResult selection = await _questionSelectionEngine.SelectAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            existing.Document,
            cancellationToken);

        existing.Document.RequiredMustQuestionKeys =
            DraftAdmissionResponseComposer.ExtractAllMustQuestionKeys(selection);

        DraftRequestResponse? admitted = await _draftRepository.UpdateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            DraftRequestStatus.Admitted,
            existing.Document,
            redirectReason: null,
            existing.SpawnedRunId,
            cancellationToken);

        return DraftAdmissionResponseComposer.BuildAdmissionResponse(
            _feasibilityVerdictBuilder,
            admitted!,
            admitted: true,
            redirectReason: null,
            selection);
    }

    /// <inheritdoc />
    public async Task<DraftQuestionsResponse?> GetQuestionsAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DraftRequestResponse? existing = await _crudService.GetAsync(scope, draftId, cancellationToken);

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

    /// <inheritdoc />
    public async Task<SubmitDraftResponse?> SubmitAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DraftRequestResponse? existing = await _crudService.GetAsync(scope, draftId, cancellationToken);

        if (existing is null)
            return null;

        if (DraftRequestStateMachine.AllowsSubmitReplay(existing.Status))
            return await ReplaySpawnedSubmitAsync(scope, draftId, existing, cancellationToken);

        if (existing.Status == DraftRequestStatus.Submitted)
            return await HealOrRejectSubmittedSubmitAsync(scope, draftId, existing, cancellationToken);

        if (!DraftRequestStateMachine.AllowsSubmit(existing.Status))
            throw new InvalidOperationException($"Draft '{draftId}' cannot be submitted from status '{existing.Status}'.");

        DraftDocumentMutator.EnsureMustQuestionsAnswered(existing.Document);
        ArchitectureDraftReviewReadinessValidator.EnsureReviewReady(existing.Document);

        if (!string.IsNullOrWhiteSpace(existing.Document.SystemName))
        {
            await _workspaceSystemNameCollisionGuard
                .EnsureAvailableAsync(scope, existing.Document.SystemName, excludeDraftId: draftId, cancellationToken: cancellationToken)
                .ConfigureAwait(false);
        }

        ArchitectureRequest architectureRequest = _projector.Project(existing.Document, draftId);

        CreateRunCommandResult createResult = await _architectureRunCommandService.CreateRunAsync(
            scope,
            architectureRequest,
            $"draft-submit:{draftId:N}",
            cancellationToken);

        string spawnedRunId = DraftSubmitRunCreateResolver.ResolveRunId(createResult);

        DraftRequestResponse? spawned = await _draftRepository.UpdateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            DraftRequestStatus.RunSpawned,
            existing.Document,
            existing.RedirectReason,
            spawnedRunId,
            cancellationToken);

        string? parentSpawnedRunId = await ResolveParentSpawnedRunIdAsync(
            scope,
            existing.Document.ParentDraftId,
            cancellationToken);

        return DraftSubmitResponseFactory.Create(
            draftId,
            spawned!.Status,
            spawnedRunId,
            architectureRequest.RequestId,
            parentSpawnedRunId);
    }

    private async Task<SubmitDraftResponse> ReplaySpawnedSubmitAsync(
        ScopeContext scope,
        Guid draftId,
        DraftRequestResponse existing,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(existing.SpawnedRunId))
        {
            throw new InvalidOperationException(
                $"Draft '{draftId}' is in status '{existing.Status}' but has no spawned run id.");
        }

        ArchitectureRequest architectureRequest = _projector.Project(existing.Document, draftId);

        string? parentSpawnedRunId = await ResolveParentSpawnedRunIdAsync(
            scope,
            existing.Document.ParentDraftId,
            cancellationToken);

        return DraftSubmitResponseFactory.Create(
            draftId,
            existing.Status,
            existing.SpawnedRunId,
            architectureRequest.RequestId,
            parentSpawnedRunId);
    }

    private async Task<SubmitDraftResponse> HealOrRejectSubmittedSubmitAsync(
        ScopeContext scope,
        Guid draftId,
        DraftRequestResponse existing,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(existing.SpawnedRunId))
            throw new ConflictException(DraftSubmitSplitState.ConflictMessage(draftId));

        DraftRequestResponse? healed = await _draftRepository.UpdateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            DraftRequestStatus.RunSpawned,
            existing.Document,
            existing.RedirectReason,
            existing.SpawnedRunId,
            cancellationToken);

        ArchitectureRequest architectureRequest = _projector.Project(existing.Document, draftId);

        string? parentSpawnedRunId = await ResolveParentSpawnedRunIdAsync(
            scope,
            existing.Document.ParentDraftId,
            cancellationToken);

        return DraftSubmitResponseFactory.Create(
            draftId,
            healed!.Status,
            existing.SpawnedRunId,
            architectureRequest.RequestId,
            parentSpawnedRunId);
    }

    private async Task<string?> ResolveParentSpawnedRunIdAsync(
        ScopeContext scope,
        Guid? parentDraftId,
        CancellationToken cancellationToken)
    {
        if (parentDraftId is null)
            return null;

        DraftRequestResponse? parent = await _crudService.GetAsync(scope, parentDraftId.Value, cancellationToken);

        if (parent is null || string.IsNullOrWhiteSpace(parent.SpawnedRunId))
            return null;

        return parent.SpawnedRunId;
    }

    private async Task ApplyPriorAnswerReuseAsync(
        ScopeContext scope,
        Guid draftId,
        DraftRequestDocument document,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<DraftRequestResponse> priorRunSpawned = await _draftRepository.ListRunSpawnedInScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            DraftPriorAnswerReuseApplicator.MaxPriorDrafts,
            cancellationToken);

        DraftPriorAnswerReuseApplicator.Apply(document, priorRunSpawned);
    }
}
