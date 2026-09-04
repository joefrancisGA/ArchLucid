using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Drafts;

/// <inheritdoc cref="IDraftSnapshotCloningService" />
public sealed class DraftSnapshotCloningService(
    IDraftRequestRepository draftRepository,
    IDraftRequestCrudService crudService) : IDraftSnapshotCloningService
{
    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IDraftRequestCrudService _crudService =
        crudService ?? throw new ArgumentNullException(nameof(crudService));

    /// <inheritdoc />
    public async Task<CloneSnapshotDraftResponse?> CloneSnapshotAsync(
        ScopeContext scope,
        Guid sourceDraftId,
        string actorUserId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorUserId);

        DraftRequestResponse? source = await _crudService.GetAsync(scope, sourceDraftId, cancellationToken);

        if (source is null)
        {
            return null;
        }

        if (!DraftRequestStateMachine.AllowsSnapshotClone(source.Status))
        {
            throw new InvalidOperationException(
                $"Draft '{sourceDraftId}' cannot clone a snapshot from status '{source.Status}'.");
        }

        DraftRequestDocument cloneDocument = DraftRequestDocumentCloner.Clone(source.Document);
        cloneDocument.ParentDraftId = sourceDraftId;
        cloneDocument.ConversationThreadId = null;

        DraftRequestResponse clone = await _draftRepository.CreateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            actorUserId,
            cloneDocument,
            cancellationToken);

        return new CloneSnapshotDraftResponse
        {
            SourceDraftId = sourceDraftId,
            SourceSpawnedRunId = source.SpawnedRunId,
            Clone = clone,
        };
    }
}
