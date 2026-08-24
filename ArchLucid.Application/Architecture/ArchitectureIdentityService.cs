using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
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
            .CreateAsync(scope, knowledgeModelId, cancellationToken)
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
}
