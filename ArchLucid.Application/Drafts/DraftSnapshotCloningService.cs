using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Drafts;

/// <inheritdoc cref="IDraftSnapshotCloningService" />
public sealed class DraftSnapshotCloningService(
    IDraftRequestRepository draftRepository,
    IDraftRequestCrudService crudService,
    IScopeContextProvider scopeContextProvider,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    IArchitectureIdentityService architectureIdentityService) : IDraftSnapshotCloningService
{
    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IDraftRequestCrudService _crudService =
        crudService ?? throw new ArgumentNullException(nameof(crudService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IArchitectureIdentityService _architectureIdentityService =
        architectureIdentityService ?? throw new ArgumentNullException(nameof(architectureIdentityService));

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

        await DraftSnapshotCloneSealedManifestHashGuard.EnsureSpawnedRunSealedManifestHashOrThrowAsync(
            source.SpawnedRunId,
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

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

        ArchitectureIdentityRecord identity = await _architectureIdentityService.EnsureForDraftAsync(
            scope,
            clone.DraftId,
            ArchitectureIdentityDisplayNameResolver.ResolveFromDraft(clone.Document),
            cancellationToken);

        clone.ArchitectureId = identity.ArchitectureId;

        return new CloneSnapshotDraftResponse
        {
            SourceDraftId = sourceDraftId,
            SourceSpawnedRunId = source.SpawnedRunId,
            Clone = clone,
        };
    }
}
