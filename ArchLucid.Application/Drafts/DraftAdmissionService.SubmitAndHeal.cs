using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts.PriorAnswerReuse;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

using FluentValidation;

namespace ArchLucid.Application.Drafts;

public sealed partial class DraftAdmissionService
{
    /// <inheritdoc />
    public async Task<SubmitDraftResponse?> SubmitAsync(
        ScopeContext scope,
        Guid draftId,
        DateTime? expectedUpdatedUtc,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DraftRequestResponse? existing = await _crudService.GetAsync(scope, draftId, cancellationToken);

        if (existing is null)
            return null;

        DraftStartReviewStaleUpdatedUtcGuard.EnsureStartReviewNotStaleOrThrow(existing, expectedUpdatedUtc);

        if (DraftRequestStateMachine.AllowsSubmitReplay(existing.Status))
        {
            EnsureSpawnedDocumentHashMatches(draftId, existing);

            return await ReplaySpawnedSubmitAsync(scope, draftId, existing, cancellationToken);
        }

        if (existing.Status == DraftRequestStatus.Submitted)
            return await HealOrRejectSubmittedSubmitAsync(scope, draftId, existing, cancellationToken);

        if (!DraftRequestStateMachine.AllowsSubmit(existing.Status))
            throw new InvalidOperationException($"Draft '{draftId}' cannot be submitted from status '{existing.Status}'.");

        DraftDocumentMutator.EnsureMustQuestionsAnswered(existing.Document);
        ArchitectureDraftReviewReadinessValidator.EnsureReviewReady(existing.Document);

        if (!string.IsNullOrWhiteSpace(existing.Document.SystemName))
        {
            Guid? excludeRunId = ArchitectureReviewSourceRunResolver.TryParseRunGuid(existing.Document.PriorRunId);

            await _workspaceSystemNameCollisionGuard
                .EnsureAvailableAsync(
                    scope,
                    existing.Document.SystemName,
                    WorkspaceSystemNameOccupancyKind.Review,
                    excludeDraftId: draftId,
                    excludeRunId: excludeRunId,
                    cancellationToken: cancellationToken)
                .ConfigureAwait(false);
        }

        ArchitectureRequest architectureRequest = _projector.Project(existing.Document, draftId);

        await ValidateProjectedArchitectureRequestOrThrowAsync(architectureRequest, cancellationToken);

        CreateRunCommandResult createResult = await _architectureRunCommandService.CreateRunAsync(
            scope,
            architectureRequest,
            $"draft-submit:{draftId:N}",
            cancellationToken);

        string spawnedRunId = DraftSubmitRunCreateResolver.ResolveRunId(createResult);

        Guid? spawnedArchitectureVersionId = await TryResolveSpawnedArchitectureVersionIdAsync(
            scope,
            createResult,
            spawnedRunId,
            cancellationToken);

        byte[] spawnedDocumentContentHashSha256 = DraftDocumentContentFingerprint.Compute(existing.Document);

        DraftRequestResponse? spawned = await _draftRepository.UpdateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            DraftRequestStatus.RunSpawned,
            existing.Document,
            existing.RedirectReason,
            spawnedRunId,
            cancellationToken,
            spawnedArchitectureVersionId,
            spawnedDocumentContentHashSha256);

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

    private async Task<Guid?> TryResolveSpawnedArchitectureVersionIdAsync(
        ScopeContext scope,
        CreateRunCommandResult createResult,
        string spawnedRunId,
        CancellationToken cancellationToken)
    {
        if (createResult.SynthesisResult?.ArchitectureVersionId is Guid synthesisVersionId
            && synthesisVersionId != Guid.Empty)
        {
            return synthesisVersionId;
        }

        if (!Guid.TryParseExact(spawnedRunId, "N", out Guid runGuid) && !Guid.TryParse(spawnedRunId, out runGuid))
            return null;

        Persistence.Models.RunRecord? header =
            await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        return header?.ArchitectureVersionId;
    }

    private async Task ValidateProjectedArchitectureRequestOrThrowAsync(
        ArchitectureRequest architectureRequest,
        CancellationToken cancellationToken)
    {
        FluentValidation.Results.ValidationResult validation =
            await _architectureRequestValidator.ValidateAsync(architectureRequest, cancellationToken);

        if (validation.IsValid)
            return;

        string message = string.Join(' ', validation.Errors.Select(static e => e.ErrorMessage));

        throw new ArgumentException(message, nameof(architectureRequest));
    }

    private static void EnsureSpawnedDocumentHashMatches(Guid draftId, DraftRequestResponse existing)
    {
        if (existing.SpawnedDocumentContentHashSha256 is null)
            return;

        byte[] currentHash = DraftDocumentContentFingerprint.Compute(existing.Document);

        if (DraftDocumentContentFingerprint.SequenceEqual(currentHash, existing.SpawnedDocumentContentHashSha256))
            return;

        throw new ConflictException(
            $"Draft '{draftId}' document changed after spawn; resubmit requires a new draft revision.");
    }
}
