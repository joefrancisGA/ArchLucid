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

public interface IArchitectureIdentityBackfillService
{
    /// <summary>
    ///     Idempotent conservative backfill for legacy runs and drafts with null <c>ArchitectureId</c> (DA-12).
    /// </summary>
    Task<ArchitectureIdentityBackfillReport> BackfillScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);
}

/// <summary>
///     Conservative architecture-identity backfill: one identity per orphan draft, no SystemName merge (DA-12).
/// </summary>
public sealed class ArchitectureIdentityBackfillService(
    IArchitectureIdentityService architectureIdentityService,
    IArchitectureIdentityRepository architectureIdentityRepository,
    IRunRepository runRepository,
    IDraftRequestRepository draftRequestRepository,
    IArchitectureRequestRepository architectureRequestRepository) : IArchitectureIdentityBackfillService
{
    private const int BatchSize = 500;

    private readonly IArchitectureIdentityService _architectureIdentityService =
        architectureIdentityService ?? throw new ArgumentNullException(nameof(architectureIdentityService));

    private readonly IArchitectureIdentityRepository _architectureIdentityRepository =
        architectureIdentityRepository ?? throw new ArgumentNullException(nameof(architectureIdentityRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IDraftRequestRepository _draftRequestRepository =
        draftRequestRepository ?? throw new ArgumentNullException(nameof(draftRequestRepository));

    private readonly IArchitectureRequestRepository _architectureRequestRepository =
        architectureRequestRepository ?? throw new ArgumentNullException(nameof(architectureRequestRepository));

    public async Task<ArchitectureIdentityBackfillReport> BackfillScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        ArchitectureIdentityBackfillReport report = new();

        report.SpawnedDraftsLinked += await LinkSpawnedDraftsToRunArchitectureAsync(scope, cancellationToken)
            .ConfigureAwait(false);
        report.CreatedRunsLinked += await BackfillCreatedOriginRunsAsync(scope, report, cancellationToken)
            .ConfigureAwait(false);
        report.ReviewRunsLinked += await BackfillReviewOriginRunsAsync(scope, cancellationToken)
            .ConfigureAwait(false);
        report.OrphanDraftsLinked += await BackfillOrphanDraftsAsync(scope, cancellationToken)
            .ConfigureAwait(false);

        return report;
    }

    private async Task<int> LinkSpawnedDraftsToRunArchitectureAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        int linked = 0;

        while (true)
        {
            IReadOnlyList<DraftRequestResponse> drafts = await _draftRequestRepository
                .ListWithNullArchitectureIdAsync(
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    BatchSize,
                    cancellationToken)
                .ConfigureAwait(false);

            if (drafts.Count == 0)
                break;

            foreach (DraftRequestResponse draft in drafts)
            {
                if (string.IsNullOrWhiteSpace(draft.SpawnedRunId))
                    continue;

                Guid? spawnedRunId = ArchitectureReviewSourceRunResolver.TryParseRunGuid(draft.SpawnedRunId);

                if (!spawnedRunId.HasValue)
                    continue;

                RunRecord? spawnedRun = await _runRepository
                    .GetByIdAsync(scope, spawnedRunId.Value, cancellationToken)
                    .ConfigureAwait(false);

                if (spawnedRun?.ArchitectureId is not Guid architectureId)
                    continue;

                bool updated = await _draftRequestRepository
                    .SetArchitectureIdAsync(
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId,
                        draft.DraftId,
                        architectureId,
                        cancellationToken)
                    .ConfigureAwait(false);

                if (updated)
                    linked++;
            }

            if (drafts.Count < BatchSize)
                break;
        }

        return linked;
    }

    private async Task<int> BackfillCreatedOriginRunsAsync(
        ScopeContext scope,
        ArchitectureIdentityBackfillReport report,
        CancellationToken cancellationToken)
    {
        int linked = 0;

        while (true)
        {
            IReadOnlyList<RunRecord> runs = await _runRepository
                .ListWithNullArchitectureIdAsync(scope, BatchSize, cancellationToken)
                .ConfigureAwait(false);

            if (runs.Count == 0)
                break;

            foreach (RunRecord run in runs)
            {
                if (!IsCreatedOriginRun(run))
                    continue;

                ArchitectureIdentityRecord? identity = await _architectureIdentityService
                    .EnsureCreatedRunIdentityAsync(
                        scope,
                        run.RunId,
                        run.KnowledgeModelId,
                        cancellationToken)
                    .ConfigureAwait(false);

                if (identity is not null)
                {
                    linked++;

                    bool refreshed = await TryRefreshDisplayNameFromRequestAsync(
                        scope,
                        run,
                        identity.ArchitectureId,
                        cancellationToken).ConfigureAwait(false);

                    if (refreshed)
                        report.DisplayNamesRefreshed++;
                }
            }

            if (runs.Count < BatchSize)
                break;
        }

        return linked;
    }

    private async Task<int> BackfillReviewOriginRunsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        int linked = 0;

        while (true)
        {
            IReadOnlyList<RunRecord> runs = await _runRepository
                .ListWithNullArchitectureIdAsync(scope, BatchSize, cancellationToken)
                .ConfigureAwait(false);

            if (runs.Count == 0)
                break;

            foreach (RunRecord run in runs)
            {
                if (run.ArchitectureId.HasValue || IsCreatedOriginRun(run))
                    continue;

                ArchitectureRequest? request = await TryLoadArchitectureRequestAsync(run, cancellationToken)
                    .ConfigureAwait(false);

                if (request is null || !ArchitectureReviewSourceRunResolver.IsReviewOrigin(request))
                    continue;

                ArchitectureIdentityRecord? identity = await _architectureIdentityService
                    .TryEnsureReviewRunLinkedAsync(
                        scope,
                        run.RunId,
                        request,
                        run.KnowledgeModelId,
                        cancellationToken)
                    .ConfigureAwait(false);

                if (identity is not null)
                    linked++;
            }

            if (runs.Count < BatchSize)
                break;
        }

        return linked;
    }

    private async Task<int> BackfillOrphanDraftsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        int linked = 0;

        while (true)
        {
            IReadOnlyList<DraftRequestResponse> drafts = await _draftRequestRepository
                .ListWithNullArchitectureIdAsync(
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    BatchSize,
                    cancellationToken)
                .ConfigureAwait(false);

            if (drafts.Count == 0)
                break;

            foreach (DraftRequestResponse draft in drafts)
            {
                if (draft.ArchitectureId.HasValue)
                    continue;

                string displayName = ResolveDraftDisplayName(draft);

                ArchitectureIdentityRecord identity = await _architectureIdentityService
                    .EnsureForDraftAsync(scope, draft.DraftId, displayName, cancellationToken)
                    .ConfigureAwait(false);

                if (identity.ArchitectureId != Guid.Empty)
                    linked++;
            }

            if (drafts.Count < BatchSize)
                break;
        }

        return linked;
    }

    private async Task<bool> TryRefreshDisplayNameFromRequestAsync(
        ScopeContext scope,
        RunRecord run,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        ArchitectureRequest? request = await TryLoadArchitectureRequestAsync(run, cancellationToken)
            .ConfigureAwait(false);

        if (request is null || string.IsNullOrWhiteSpace(request.SystemName))
            return false;

        return await _architectureIdentityRepository
            .TryUpdateDisplayNameWhenUntitledAsync(scope, architectureId, request.SystemName, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<ArchitectureRequest?> TryLoadArchitectureRequestAsync(
        RunRecord run,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
            return null;

        return await _architectureRequestRepository
            .GetByIdAsync(run.ArchitectureRequestId, cancellationToken)
            .ConfigureAwait(false);
    }

    private static bool IsCreatedOriginRun(RunRecord run) =>
        string.Equals(run.PackageOrigin, ArchitecturePackageOrigin.Created, StringComparison.Ordinal);

    private static string ResolveDraftDisplayName(DraftRequestResponse draft)
    {
        if (!string.IsNullOrWhiteSpace(draft.Document.SystemName))
            return draft.Document.SystemName;

        if (!string.IsNullOrWhiteSpace(draft.Document.FreeTextIntent))
            return draft.Document.FreeTextIntent;

        return ArchitectureIdentityDisplayNameDefaults.UntitledArchitecture;
    }
}
