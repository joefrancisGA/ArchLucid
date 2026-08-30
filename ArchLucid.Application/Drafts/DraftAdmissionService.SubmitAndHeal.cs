using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts.PriorAnswerReuse;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

public sealed partial class DraftAdmissionService
{
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
            Guid? excludeRunId = ArchitectureReviewSourceRunResolver.TryParseRunGuid(existing.Document.PriorRunId);

            await _workspaceSystemNameCollisionGuard
                .EnsureAvailableAsync(scope, existing.Document.SystemName, excludeDraftId: draftId, excludeRunId: excludeRunId, cancellationToken: cancellationToken)
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
