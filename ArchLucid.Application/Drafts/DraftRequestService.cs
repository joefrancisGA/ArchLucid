using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts.PriorAnswerReuse;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Drafts;

/// <inheritdoc cref="IDraftRequestService" />
public sealed class DraftRequestService(
    IDraftRequestRepository draftRepository,
    IDraftAdmissionGate admissionGate,
    IDraftSemanticAdmissionEvaluator semanticAdmissionEvaluator,
    IQuestionSelectionEngine questionSelectionEngine,
    IDraftRequestProjector projector,
    IArchitectureRunCreateOrchestrator runCreateOrchestrator,
    IRequestContentSafetyPrecheck contentSafetyPrecheck,
    FeasibilityVerdictBuilder feasibilityVerdictBuilder,
    IPriorPackageSemanticMergeService priorPackageSemanticMergeService,
    IOptionsMonitor<DraftIntakeBranchOptions> branchOptionsMonitor,
    IWorkspaceSystemNameCollisionGuard workspaceSystemNameCollisionGuard) : IDraftRequestService
{
    private readonly IDraftAdmissionGate _admissionGate =
        admissionGate ?? throw new ArgumentNullException(nameof(admissionGate));

    private readonly IDraftSemanticAdmissionEvaluator _semanticAdmissionEvaluator =
        semanticAdmissionEvaluator ?? throw new ArgumentNullException(nameof(semanticAdmissionEvaluator));

    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IRequestContentSafetyPrecheck _contentSafetyPrecheck =
        contentSafetyPrecheck ?? throw new ArgumentNullException(nameof(contentSafetyPrecheck));

    private readonly IQuestionSelectionEngine _questionSelectionEngine =
        questionSelectionEngine ?? throw new ArgumentNullException(nameof(questionSelectionEngine));

    private readonly IDraftRequestProjector _projector =
        projector ?? throw new ArgumentNullException(nameof(projector));

    private readonly IArchitectureRunCreateOrchestrator _runCreateOrchestrator =
        runCreateOrchestrator ?? throw new ArgumentNullException(nameof(runCreateOrchestrator));

    private readonly FeasibilityVerdictBuilder _feasibilityVerdictBuilder =
        feasibilityVerdictBuilder ?? throw new ArgumentNullException(nameof(feasibilityVerdictBuilder));

    private readonly IPriorPackageSemanticMergeService _priorPackageSemanticMergeService =
        priorPackageSemanticMergeService
        ?? throw new ArgumentNullException(nameof(priorPackageSemanticMergeService));

    private readonly IOptionsMonitor<DraftIntakeBranchOptions> _branchOptionsMonitor =
        branchOptionsMonitor ?? throw new ArgumentNullException(nameof(branchOptionsMonitor));

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

        DraftRequestDocument document = new()
        {
            FreeTextIntent = intent,
            FocusedPilotModeEnabled = true,
            WorkflowIntent = NormalizeWorkflowIntent(request.WorkflowIntent),
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
                    .EnsureAvailableAsync(scope, trimmedName, draftId, cancellationToken)
                    .ConfigureAwait(false);
            }
        }

        ApplyPatch(existing.Document, patch);
        SyncTransparencyFromDocument(existing.Document);

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
        RemoveSkippedQuestion(existing.Document, request.QuestionKey.Trim());
        RecordAssertedAnswer(existing.Document, request.QuestionKey.Trim(), request.Answer.Trim());

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
        UpsertSkipped(existing.Document, questionKey, question.Tier);

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
    public async Task<DraftAdmissionResponse?> RequestAdmissionAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DraftRequestResponse? existing = await GetAsync(scope, draftId, cancellationToken);

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

            return BuildAdmissionResponse(redirected!, admitted: false, reason);
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

            return BuildAdmissionResponse(redirected!, admitted: false, evaluation.RedirectReason);
        }

        DraftAdmissionEvaluation? semanticRedirect =
            await TrySemanticRedirectAsync(existing.Document, cancellationToken);

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

            return BuildAdmissionResponse(redirected!, admitted: false, semanticRedirect.RedirectReason);
        }

        await ApplyPriorAnswerReuseAsync(scope, draftId, existing.Document, cancellationToken);

        QuestionSelectionResult selection = await _questionSelectionEngine.SelectAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            existing.Document,
            cancellationToken);

        existing.Document.RequiredMustQuestionKeys = ExtractAllMustQuestionKeys(selection);

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

        return BuildAdmissionResponse(admitted!, admitted: true, redirectReason: null, selection);
    }

    /// <inheritdoc />
    public async Task<DraftQuestionsResponse?> GetQuestionsAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DraftRequestResponse? existing = await GetAsync(scope, draftId, cancellationToken);

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

        DraftRequestResponse? existing = await GetAsync(scope, draftId, cancellationToken);

        if (existing is null)
            return null;

        if (!DraftRequestStateMachine.AllowsSubmit(existing.Status))
            throw new InvalidOperationException($"Draft '{draftId}' cannot be submitted from status '{existing.Status}'.");

        EnsureMustQuestionsAnswered(existing.Document);
        ArchitectureDraftReviewReadinessValidator.EnsureReviewReady(existing.Document);

        if (!string.IsNullOrWhiteSpace(existing.Document.SystemName))
        {
            await _workspaceSystemNameCollisionGuard
                .EnsureAvailableAsync(scope, existing.Document.SystemName, draftId, cancellationToken)
                .ConfigureAwait(false);
        }

        ArchitectureRequest architectureRequest = _projector.Project(existing.Document, draftId);

        await _draftRepository.UpdateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            DraftRequestStatus.Submitted,
            existing.Document,
            existing.RedirectReason,
            existing.SpawnedRunId,
            cancellationToken);

        CreateRunResult createResult =
            await _runCreateOrchestrator.CreateRunAsync(architectureRequest, idempotency: null, cancellationToken);

        DraftRequestResponse? spawned = await _draftRepository.UpdateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            DraftRequestStatus.RunSpawned,
            existing.Document,
            existing.RedirectReason,
            createResult.Run.RunId,
            cancellationToken);

        string? parentSpawnedRunId = await ResolveParentSpawnedRunIdAsync(
            scope,
            existing.Document.ParentDraftId,
            cancellationToken);

        return new SubmitDraftResponse
        {
            DraftId = draftId,
            Status = spawned!.Status,
            RunId = createResult.Run.RunId,
            RequestId = architectureRequest.RequestId,
            ParentSpawnedRunId = parentSpawnedRunId,
        };
    }

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

        DraftRequestResponse? parent = await GetAsync(scope, parentDraftId, cancellationToken);

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
        SyncTransparencyFromDocument(branchDocument);

        if (request.OverrideKind == DraftBranchOverrideKind.QuestionAnswer
            && !string.IsNullOrWhiteSpace(request.OverrideKey))
        {
            RecordAssertedAnswer(
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
                await TrySemanticRedirectAsync(branchDocument, cancellationToken);

            if (semanticRedirect is null)
            {
                QuestionSelectionResult selection = await _questionSelectionEngine.SelectAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                branchDocument,
                cancellationToken);

            branchDocument.RequiredMustQuestionKeys = ExtractAllMustQuestionKeys(selection);

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

        DraftRequestResponse? existing = await GetAsync(scope, draftId, cancellationToken);

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

    private async Task<string?> ResolveParentSpawnedRunIdAsync(
        ScopeContext scope,
        Guid? parentDraftId,
        CancellationToken cancellationToken)
    {
        if (parentDraftId is null)
            return null;

        DraftRequestResponse? parent = await GetAsync(scope, parentDraftId.Value, cancellationToken);

        if (parent is null || string.IsNullOrWhiteSpace(parent.SpawnedRunId))
            return null;

        return parent.SpawnedRunId;
    }

    private static void ApplyPatch(DraftRequestDocument document, PatchDraftRequest patch)
    {
        if (patch.FreeTextIntent is not null)
        {
            string intent = patch.FreeTextIntent.Trim();

            if (intent.Length == 0)
            {
                document.FreeTextIntent = string.Empty;
            }
            else if (intent.Length < DraftIntakeValidation.MinimumFreeTextIntentLength)
            {
                throw new InvalidOperationException(
                    $"FreeTextIntent must be at least {DraftIntakeValidation.MinimumFreeTextIntentLength} characters after trim.");
            }
            else
            {
                document.FreeTextIntent = intent;
            }
        }

        if (patch.SystemName is not null)
            document.SystemName = patch.SystemName.Trim();

        if (patch.BusinessOutcome is not null)
            document.BusinessOutcome = patch.BusinessOutcome.Trim();

        if (patch.ActorSet is not null)
            document.ActorSet = patch.ActorSet;

        if (patch.FocusedPilotModeEnabled.HasValue)
            document.FocusedPilotModeEnabled = patch.FocusedPilotModeEnabled.Value;

        if (patch.WorkflowIntent is not null)
            document.WorkflowIntent = NormalizeWorkflowIntent(patch.WorkflowIntent);

        if (patch.StructuredBrief is not null)
        {
            document.StructuredBrief ??= new ArchitectureDraftStructuredBrief();
            ApplyStructuredBriefPatch(document.StructuredBrief, patch.StructuredBrief);
        }
    }

    private static void ApplyStructuredBriefPatch(
        ArchitectureDraftStructuredBrief target,
        ArchitectureDraftStructuredBrief patch)
    {
        ArgumentNullException.ThrowIfNull(target);
        ArgumentNullException.ThrowIfNull(patch);

        target.ConfirmedConstraints = CopyTrimmedList(patch.ConfirmedConstraints);
        target.ConfirmedAssumptions = CopyTrimmedList(patch.ConfirmedAssumptions);
        target.ConfirmedRequiredCapabilities = CopyTrimmedList(patch.ConfirmedRequiredCapabilities);
        target.SuggestedConstraints = CopyTrimmedList(patch.SuggestedConstraints);
        target.SuggestedAssumptions = CopyTrimmedList(patch.SuggestedAssumptions);
        target.SuggestedRequiredCapabilities = CopyTrimmedList(patch.SuggestedRequiredCapabilities);
        target.DeniedConstraints = CopyTrimmedList(patch.DeniedConstraints);
        target.DeniedAssumptions = CopyTrimmedList(patch.DeniedAssumptions);
        target.DeniedRequiredCapabilities = CopyTrimmedList(patch.DeniedRequiredCapabilities);
        target.QualityAttribute = patch.QualityAttribute?.Trim();
        target.FailureModeNote = patch.FailureModeNote?.Trim();
        target.OperationalOwner = patch.OperationalOwner?.Trim();
    }

    private static List<string> CopyTrimmedList(IReadOnlyList<string>? items)
    {
        if (items is null)
            return [];

        List<string> copied = [];

        foreach (string item in items)
        {
            string trimmed = item.Trim();

            if (trimmed.Length == 0)
                continue;

            copied.Add(trimmed);
        }

        return copied;
    }

    private static void SyncTransparencyFromDocument(DraftRequestDocument document)
    {
        if (!string.IsNullOrWhiteSpace(document.BusinessOutcome))
        {
            UpsertAsserted(document.TransparencyTrail, "businessOutcome", document.BusinessOutcome.Trim());
        }

        foreach (ActorDescriptor actor in document.ActorSet.Actors)
        {
            string key = string.IsNullOrWhiteSpace(actor.Label)
                ? $"actor.{actor.Kind}.{actor.TrustOrigin}.{actor.Contract}"
                : $"actor.{actor.Label}";

            if (actor.Origin == ActorOrigin.Asserted)
            {
                UpsertAsserted(
                    document.TransparencyTrail,
                    key,
                    $"{actor.Kind}/{actor.TrustOrigin}/{actor.Contract}");
            }
            else
            {
                UpsertInferred(
                    document.TransparencyTrail,
                    key,
                    $"{actor.Kind}/{actor.TrustOrigin}/{actor.Contract}",
                    actor.Confidence);
            }
        }
    }

    private static void EnsureMustQuestionsAnswered(DraftRequestDocument document)
    {
        UniversalIntakeMustQuestionCompleteness.EnsureComplete(
            document.QuestionAnswers,
            document.TransparencyTrail,
            document.RequiredMustQuestionKeys);
    }

    private static void RemoveSkippedQuestion(DraftRequestDocument document, string questionKey)
    {
        document.TransparencyTrail.Skipped.RemoveAll(entry =>
            string.Equals(entry.QuestionKey, questionKey, StringComparison.OrdinalIgnoreCase));
    }

    private static void UpsertSkipped(DraftRequestDocument document, string questionKey, ElicitationQuestionTier tier)
    {
        SkippedQuestionTrailEntry? existing = document.TransparencyTrail.Skipped.Find(entry =>
            string.Equals(entry.QuestionKey, questionKey, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            document.TransparencyTrail.Skipped.Add(
                new SkippedQuestionTrailEntry { QuestionKey = questionKey, Tier = tier });

            return;
        }

        existing.Tier = tier;
    }

    private static void RecordAssertedAnswer(DraftRequestDocument document, string questionKey, string answer)
    {
        UpsertAsserted(document.TransparencyTrail, $"answer.{questionKey}", answer);
    }

    private static void UpsertAsserted(TransparencyTrail trail, string key, string value)
    {
        AssertedTrailEntry? existing = trail.Asserted.Find(entry =>
            string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            trail.Asserted.Add(new AssertedTrailEntry { Key = key, Value = value });

            return;
        }

        existing.Value = value;
    }

    private static void UpsertInferred(TransparencyTrail trail, string key, string value, int confidence)
    {
        InferredTrailEntry? existing = trail.Inferred.Find(entry =>
            string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            trail.Inferred.Add(new InferredTrailEntry { Key = key, Value = value, Confidence = confidence });

            return;
        }

        existing.Value = value;
        existing.Confidence = confidence;
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

    private async Task<DraftAdmissionEvaluation?> TrySemanticRedirectAsync(
        DraftRequestDocument document,
        CancellationToken cancellationToken)
    {
        DraftSemanticAdmissionEvaluation semantic =
            await _semanticAdmissionEvaluator.EvaluateAsync(document, cancellationToken);

        if (semantic.Disposition is DraftSemanticAdmissionDispositionKind.Admitted
            or DraftSemanticAdmissionDispositionKind.EvaluatorUnavailable)
        {
            return null;
        }

        return new DraftAdmissionEvaluation
        {
            Admitted = false,
            RedirectReason = semantic.RedirectReason,
        };
    }

    private DraftAdmissionResponse BuildAdmissionResponse(
        DraftRequestResponse draft,
        bool admitted,
        string? redirectReason,
        QuestionSelectionResult? selection = null)
    {
        FeasibilityVerdict verdict = admitted
            ? _feasibilityVerdictBuilder.Feasible(
                "Draft contains sufficient designable intent for admission.",
                draft.Document.TransparencyTrail)
            : _feasibilityVerdictBuilder.FromIntakeRedirect(
                redirectReason ?? "Draft redirected.",
                draft.Document.TransparencyTrail,
                "Draft does not yet meet minimum designable-intent requirements.");

        return new DraftAdmissionResponse
        {
            Admitted = admitted,
            Status = draft.Status,
            RedirectReason = redirectReason,
            Draft = draft,
            PendingMustQuestions = selection?.PendingMustQuestions ?? [],
            RequiredMustQuestionKeys = selection?.RequiredMustQuestionKeys
                ?? draft.Document.RequiredMustQuestionKeys,
            Verdict = verdict,
        };
    }

    private static string? NormalizeWorkflowIntent(string? workflowIntent)
    {
        string? intent = workflowIntent?.Trim();

        if (string.IsNullOrWhiteSpace(intent))
            return null;

        if (string.Equals(intent, ArchitectureWorkflowIntent.CreateArchitecture, StringComparison.OrdinalIgnoreCase))
            return ArchitectureWorkflowIntent.CreateArchitecture;

        if (string.Equals(intent, ArchitectureWorkflowIntent.StartReview, StringComparison.OrdinalIgnoreCase))
            return ArchitectureWorkflowIntent.StartReview;

        return null;
    }

    private static List<string> ExtractAllMustQuestionKeys(QuestionSelectionResult selection)
    {
        return selection.AllQuestions
            .Where(static question => question.Tier == ElicitationQuestionTier.Must)
            .Select(static question => question.QuestionKey)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
