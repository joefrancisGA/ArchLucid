using ArchLucid.Application.Authorization;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Drafts.Stages;

/// <inheritdoc cref="IDraftRequestDeleteStage" />
public sealed class DraftRequestDeleteStage(
    IDraftRequestRepository draftRepository,
    IWorkOwnershipDeleteAuthorizationService workOwnershipDeleteAuthorizationService) : IDraftRequestDeleteStage
{
    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IWorkOwnershipDeleteAuthorizationService _workOwnershipDeleteAuthorizationService =
        workOwnershipDeleteAuthorizationService
        ?? throw new ArgumentNullException(nameof(workOwnershipDeleteAuthorizationService));

    public async Task<DraftRequestResponse?> AbandonAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DraftRequestResponse? existing = await _draftRepository
            .GetAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, draftId, cancellationToken);

        if (existing is null)
            return null;

        if (!DraftRequestStateMachine.AllowsAbandon(existing.Status))
            throw new InvalidOperationException($"Draft '{draftId}' cannot be abandoned from status '{existing.Status}'.");

        await _workOwnershipDeleteAuthorizationService
            .EnsureCanDeleteOwnedWorkAsync(existing.CreatedByUserId, cancellationToken)
            .ConfigureAwait(false);

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
}
