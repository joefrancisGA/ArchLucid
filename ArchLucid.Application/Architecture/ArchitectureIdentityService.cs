using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Architecture;

public interface IArchitectureIdentityService
{
    /// <summary>
    ///     Creates a new architecture identity for a Created-origin synthesis run and links the run header.
    /// </summary>
    Task<ArchitectureIdentityRecord?> EnsureCreatedRunIdentityAsync(
        ScopeContext scope,
        Guid runId,
        string? knowledgeModelId,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Links a review run to an existing architecture identity (re-review / compare recurrence).
    /// </summary>
    Task<bool> TryLinkRunToArchitectureAsync(
        ScopeContext scope,
        Guid runId,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Links a review-origin run to the architecture identity of its source run when resolvable.
    /// </summary>
    Task<ArchitectureIdentityRecord?> TryEnsureReviewRunLinkedAsync(
        ScopeContext scope,
        Guid reviewRunId,
        ArchitectureRequest request,
        string? knowledgeModelId = null,
        CancellationToken cancellationToken = default);

    Task<PagedResponse<ArchitectureIdentityListItem>> ListIdentitiesAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<ArchitectureIdentityDetail?> GetIdentityAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Ensures a parent architecture identity exists for a persisted draft and links
    ///     <c>DraftRequests.ArchitectureId</c> (idempotent).
    /// </summary>
    Task<ArchitectureIdentityRecord> EnsureForDraftAsync(
        ScopeContext scope,
        Guid draftId,
        string displayName,
        CancellationToken cancellationToken = default);

    /// <summary>Renames the customer-visible architecture identity without rewriting draft documents.</summary>
    Task<ArchitectureIdentityRecord?> RenameAsync(
        ScopeContext scope,
        Guid architectureId,
        string displayName,
        CancellationToken cancellationToken = default);

    /// <summary>Partially updates display name and/or description for an architecture identity.</summary>
    Task<ArchitectureIdentityRecord?> PatchAsync(
        ScopeContext scope,
        Guid architectureId,
        PatchArchitectureIdentityRequest patch,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     One-time upgrade from untitled to the draft system title when the identity is still the default.
    /// </summary>
    Task TryUpgradeUntitledDisplayNameFromDraftAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken = default);
}

public sealed class ArchitectureIdentityService(
    IArchitectureIdentityRepository architectureIdentityRepository,
    IRunRepository runRepository,
    IDraftRequestRepository draftRequestRepository) : IArchitectureIdentityService
{
    private readonly IArchitectureIdentityRepository _architectureIdentityRepository =
        architectureIdentityRepository ?? throw new ArgumentNullException(nameof(architectureIdentityRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IDraftRequestRepository _draftRequestRepository =
        draftRequestRepository ?? throw new ArgumentNullException(nameof(draftRequestRepository));

    public async Task<ArchitectureIdentityRecord?> EnsureCreatedRunIdentityAsync(
        ScopeContext scope,
        Guid runId,
        string? knowledgeModelId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run is null)
            return null;

        if (run.ArchitectureId.HasValue)
        {
            return await _architectureIdentityRepository
                .GetByIdAsync(scope, run.ArchitectureId.Value, cancellationToken)
                .ConfigureAwait(false);
        }

        ArchitectureIdentityRecord identity = await _architectureIdentityRepository
            .CreateAsync(
                scope,
                ArchitectureIdentityDisplayNameDefaults.Resolve(run.Description),
                knowledgeModelId,
                cancellationToken)
            .ConfigureAwait(false);

        run.ArchitectureId = identity.ArchitectureId;
        await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);

        return identity;
    }

    public async Task<bool> TryLinkRunToArchitectureAsync(
        ScopeContext scope,
        Guid runId,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        ArchitectureIdentityRecord? identity = await _architectureIdentityRepository
            .GetByIdAsync(scope, architectureId, cancellationToken)
            .ConfigureAwait(false);

        if (identity is null)
            return false;

        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run is null)
            return false;

        run.ArchitectureId = architectureId;
        await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);

        return true;
    }

    public async Task<ArchitectureIdentityRecord?> TryEnsureReviewRunLinkedAsync(
        ScopeContext scope,
        Guid reviewRunId,
        ArchitectureRequest request,
        string? knowledgeModelId = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (!ArchitectureReviewSourceRunResolver.IsReviewOrigin(request))
            return null;

        RunRecord? reviewRun = await _runRepository.GetByIdAsync(scope, reviewRunId, cancellationToken).ConfigureAwait(false);

        if (reviewRun is null)
            return null;

        if (reviewRun.ArchitectureId.HasValue)
        {
            return await _architectureIdentityRepository
                .GetByIdAsync(scope, reviewRun.ArchitectureId.Value, cancellationToken)
                .ConfigureAwait(false);
        }

        ArchitectureIdentityRecord? linkedFromDraft = await TryLinkReviewRunFromDraftArchitectureAsync(
            scope,
            reviewRunId,
            request,
            cancellationToken).ConfigureAwait(false);

        if (linkedFromDraft is not null)
            return linkedFromDraft;

        Guid? sourceRunId = ArchitectureReviewSourceRunResolver.TryResolveSourceRunId(request);

        if (!sourceRunId.HasValue)
            sourceRunId = await TryResolveSourceRunFromDraftSpawnedAsync(scope, request, cancellationToken).ConfigureAwait(false);

        if (!sourceRunId.HasValue)
            return null;

        return await EnsureReviewRunLinkedFromSourceRunAsync(
            scope,
            reviewRunId,
            sourceRunId.Value,
            knowledgeModelId,
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<ArchitectureIdentityRecord?> EnsureReviewRunLinkedFromSourceRunAsync(
        ScopeContext scope,
        Guid reviewRunId,
        Guid sourceRunId,
        string? knowledgeModelId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RunRecord? sourceRun = await _runRepository.GetByIdAsync(scope, sourceRunId, cancellationToken).ConfigureAwait(false);

        if (sourceRun is null)
            return null;

        Guid? architectureId = sourceRun.ArchitectureId;

        if (!architectureId.HasValue
            && string.Equals(sourceRun.PackageOrigin, ArchitecturePackageOrigin.Created, StringComparison.Ordinal))
        {
            ArchitectureIdentityRecord? legacyIdentity = await EnsureCreatedRunIdentityAsync(
                scope,
                sourceRunId,
                knowledgeModelId,
                cancellationToken).ConfigureAwait(false);

            architectureId = legacyIdentity?.ArchitectureId;
        }

        if (!architectureId.HasValue)
            return null;

        bool linked = await TryLinkRunToArchitectureAsync(scope, reviewRunId, architectureId.Value, cancellationToken)
            .ConfigureAwait(false);

        if (!linked)
            return null;

        if (!string.IsNullOrWhiteSpace(knowledgeModelId))
        {
            await _architectureIdentityRepository
                .UpdateCurrentModelAsync(scope, architectureId.Value, knowledgeModelId, cancellationToken)
                .ConfigureAwait(false);
        }

        return await _architectureIdentityRepository
            .GetByIdAsync(scope, architectureId.Value, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<Guid?> TryResolveSourceRunFromDraftSpawnedAsync(
        ScopeContext scope,
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        Guid? draftId = ArchitectureReviewSourceRunResolver.TryParseDraftIdFromRequestId(request.RequestId);

        if (!draftId.HasValue)
            return null;

        DraftRequestResponse? draft = await _draftRequestRepository
            .GetAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, draftId.Value, cancellationToken)
            .ConfigureAwait(false);

        if (draft is null || string.IsNullOrWhiteSpace(draft.SpawnedRunId))
            return null;

        return ArchitectureReviewSourceRunResolver.TryParseRunGuid(draft.SpawnedRunId);
    }

    public Task<PagedResponse<ArchitectureIdentityListItem>> ListIdentitiesAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _architectureIdentityRepository.ListAsync(scope, page, pageSize, cancellationToken);
    }

    public Task<ArchitectureIdentityDetail?> GetIdentityAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _architectureIdentityRepository.GetDetailAsync(scope, architectureId, cancellationToken);
    }

    public async Task<ArchitectureIdentityRecord> EnsureForDraftAsync(
        ScopeContext scope,
        Guid draftId,
        string displayName,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DraftRequestResponse? draft = await _draftRequestRepository
            .GetAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, draftId, cancellationToken)
            .ConfigureAwait(false);

        if (draft is null)
            throw new InvalidOperationException($"Draft '{draftId:D}' was not found in the active scope.");

        if (draft.ArchitectureId.HasValue)
        {
            ArchitectureIdentityRecord? existing = await _architectureIdentityRepository
                .GetByIdAsync(scope, draft.ArchitectureId.Value, cancellationToken)
                .ConfigureAwait(false);

            if (existing is not null)
            {
                await TryUpgradeUntitledDisplayNameFromDraftInternalAsync(
                    scope,
                    draft,
                    existing.ArchitectureId,
                    cancellationToken).ConfigureAwait(false);

                return await _architectureIdentityRepository
                    .GetByIdAsync(scope, existing.ArchitectureId, cancellationToken)
                    .ConfigureAwait(false)
                    ?? existing;
            }
        }

        Guid? inheritedArchitectureId = await TryResolveInheritedArchitectureIdFromParentDraftAsync(
            scope,
            draft,
            cancellationToken).ConfigureAwait(false);

        ArchitectureIdentityRecord identity;

        if (inheritedArchitectureId.HasValue)
        {
            identity = await _architectureIdentityRepository
                .GetByIdAsync(scope, inheritedArchitectureId.Value, cancellationToken)
                .ConfigureAwait(false)
                ?? throw new InvalidOperationException(
                    $"Architecture identity '{inheritedArchitectureId.Value:D}' was not found in the active scope.");
        }
        else
        {
            identity = await _architectureIdentityRepository
                .CreateAsync(
                    scope,
                    ArchitectureIdentityDisplayNameDefaults.Resolve(
                        ArchitectureIdentityDisplayNameResolver.ResolveFromDraft(draft.Document)),
                    currentModelId: null,
                    cancellationToken)
                .ConfigureAwait(false);
        }

        bool linked = await _draftRequestRepository
            .SetArchitectureIdAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                draftId,
                identity.ArchitectureId,
                cancellationToken)
            .ConfigureAwait(false);

        if (!linked)
            throw new InvalidOperationException($"Draft '{draftId:D}' could not be linked to architecture identity.");

        return identity;
    }

    private async Task<ArchitectureIdentityRecord?> TryLinkReviewRunFromDraftArchitectureAsync(
        ScopeContext scope,
        Guid reviewRunId,
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        Guid? draftId = ArchitectureReviewSourceRunResolver.TryParseDraftIdFromRequestId(request.RequestId);

        if (!draftId.HasValue)
            return null;

        DraftRequestResponse? draft = await _draftRequestRepository
            .GetAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, draftId.Value, cancellationToken)
            .ConfigureAwait(false);

        if (draft is null)
            return null;

        Guid architectureId;

        if (draft.ArchitectureId is not Guid linkedArchitectureId)
        {
            ArchitectureIdentityRecord ensured = await EnsureForDraftAsync(
                scope,
                draftId.Value,
                ArchitectureIdentityDisplayNameResolver.ResolveFromDraft(draft.Document),
                cancellationToken).ConfigureAwait(false);

            architectureId = ensured.ArchitectureId;
        }
        else
        {
            architectureId = linkedArchitectureId;
        }

        bool linked = await TryLinkRunToArchitectureAsync(scope, reviewRunId, architectureId, cancellationToken)
            .ConfigureAwait(false);

        if (!linked)
            return null;

        return await _architectureIdentityRepository
            .GetByIdAsync(scope, architectureId, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<Guid?> TryResolveInheritedArchitectureIdFromParentDraftAsync(
        ScopeContext scope,
        DraftRequestResponse draft,
        CancellationToken cancellationToken)
    {
        Guid? parentDraftId = draft.Document.ParentDraftId;

        if (!parentDraftId.HasValue)
            return null;

        DraftRequestResponse? parentDraft = await _draftRequestRepository
            .GetAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, parentDraftId.Value, cancellationToken)
            .ConfigureAwait(false);

        return parentDraft?.ArchitectureId;
    }

    public async Task<ArchitectureIdentityRecord?> RenameAsync(
        ScopeContext scope,
        Guid architectureId,
        string displayName,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(displayName);

        string trimmedDisplayName = displayName.Trim();

        if (trimmedDisplayName.Length == 0)
            throw new ArgumentException("Display name cannot be empty.", nameof(displayName));

        bool updated = await _architectureIdentityRepository
            .TryPatchAsync(
                scope,
                architectureId,
                updateDisplayName: true,
                ArchitectureIdentityDisplayNameDefaults.Resolve(trimmedDisplayName),
                updateDescription: false,
                description: null,
                cancellationToken)
            .ConfigureAwait(false);

        if (!updated)
            return null;

        return await _architectureIdentityRepository
            .GetByIdAsync(scope, architectureId, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<ArchitectureIdentityRecord?> PatchAsync(
        ScopeContext scope,
        Guid architectureId,
        PatchArchitectureIdentityRequest patch,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(patch);

        if (!patch.HasAnyPatch)
            throw new ArgumentException("At least one patch field is required.", nameof(patch));

        string? normalizedDisplayName = null;
        string? normalizedDescription = null;

        if (patch.HasDisplayName)
        {
            string trimmedDisplayName = patch.DisplayName!.Trim();

            if (trimmedDisplayName.Length == 0)
                throw new ArgumentException("Display name cannot be empty.", nameof(patch));

            normalizedDisplayName = ArchitectureIdentityDisplayNameDefaults.Resolve(trimmedDisplayName);
        }

        if (patch.HasDescription)
            normalizedDescription = string.IsNullOrWhiteSpace(patch.Description) ? null : patch.Description.Trim();

        bool updated = await _architectureIdentityRepository
            .TryPatchAsync(
                scope,
                architectureId,
                patch.HasDisplayName,
                normalizedDisplayName,
                patch.HasDescription,
                normalizedDescription,
                cancellationToken)
            .ConfigureAwait(false);

        if (!updated)
            return null;

        return await _architectureIdentityRepository
            .GetByIdAsync(scope, architectureId, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task TryUpgradeUntitledDisplayNameFromDraftAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DraftRequestResponse? draft = await _draftRequestRepository
            .GetAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, draftId, cancellationToken)
            .ConfigureAwait(false);

        if (draft?.ArchitectureId is not Guid architectureId)
            return;

        await TryUpgradeUntitledDisplayNameFromDraftInternalAsync(
            scope,
            draft,
            architectureId,
            cancellationToken).ConfigureAwait(false);
    }

    private async Task TryUpgradeUntitledDisplayNameFromDraftInternalAsync(
        ScopeContext scope,
        DraftRequestResponse draft,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        string? upgradeCandidate = ArchitectureIdentityDisplayNameResolver.ResolveUntitledUpgradeCandidate(draft.Document);

        if (upgradeCandidate is null)
            return;

        await _architectureIdentityRepository
            .TryUpdateDisplayNameWhenUntitledAsync(scope, architectureId, upgradeCandidate, cancellationToken)
            .ConfigureAwait(false);
    }
}
