using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Architecture;

/// <inheritdoc cref="IArchitectureSealDeltaService" />
public sealed class ArchitectureSealDeltaService(
    IArchitectureIdentityRepository architectureIdentityRepository,
    IGoldenManifestRepository goldenManifestRepository,
    IDraftRequestRepository draftRequestRepository,
    IDraftRequestProjector draftRequestProjector,
    IRunRepository runRepository) : IArchitectureSealDeltaService
{
    private readonly IArchitectureIdentityRepository _architectureIdentityRepository =
        architectureIdentityRepository ?? throw new ArgumentNullException(nameof(architectureIdentityRepository));

    private readonly IGoldenManifestRepository _goldenManifestRepository =
        goldenManifestRepository ?? throw new ArgumentNullException(nameof(goldenManifestRepository));

    private readonly IDraftRequestRepository _draftRequestRepository =
        draftRequestRepository ?? throw new ArgumentNullException(nameof(draftRequestRepository));

    private readonly IDraftRequestProjector _draftRequestProjector =
        draftRequestProjector ?? throw new ArgumentNullException(nameof(draftRequestProjector));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    public async Task<ArchitectureSealDeltaResponse?> GetSealDeltaAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        ArchitectureIdentityDetail? detail = await _architectureIdentityRepository
            .GetDetailAsync(scope, architectureId, cancellationToken)
            .ConfigureAwait(false);

        if (detail is null)
            return null;

        ArchitectureSealDeltaResponse response = new()
        {
            ArchitectureId = architectureId,
            HonestyCopy = ArchitectureSealDeltaHonesty.OrientationOnly,
            CurrentDraftId = detail.CurrentDraftId,
            LatestSealedManifestId = detail.LatestSealedManifestId,
            LatestSealedReviewRunId = detail.LatestReviewId,
        };

        if (!detail.LatestSealedManifestId.HasValue)
        {
            response.HasPriorSeal = false;
            response.EmptyStateCopy = ArchitectureSealDeltaHonesty.NoPriorSeal;
            return response;
        }

        response.HasPriorSeal = true;

        Guid? sealedReviewRunId = await _runRepository
            .GetCommittedRunIdByGoldenManifestIdAsync(
                scope,
                architectureId,
                detail.LatestSealedManifestId.Value,
                Guid.Empty,
                cancellationToken)
            .ConfigureAwait(false);

        if (sealedReviewRunId.HasValue)
            response.LatestSealedReviewRunId = sealedReviewRunId;

        if (!detail.CurrentDraftId.HasValue)
        {
            response.EmptyStateCopy = ArchitectureSealDeltaHonesty.NoOpenDraft;
            return response;
        }

        ManifestDocument? sealedManifest = await _goldenManifestRepository
            .GetByIdAsync(scope, detail.LatestSealedManifestId.Value, cancellationToken)
            .ConfigureAwait(false);

        if (sealedManifest is null)
        {
            response.HasPriorSeal = false;
            response.EmptyStateCopy = ArchitectureSealDeltaHonesty.NoPriorSeal;
            response.LatestSealedManifestId = null;
            response.LatestSealedReviewRunId = null;
            return response;
        }

        DraftRequestResponse? draft = await _draftRequestRepository
            .GetAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                detail.CurrentDraftId.Value,
                cancellationToken)
            .ConfigureAwait(false);

        if (draft is null)
        {
            response.EmptyStateCopy = ArchitectureSealDeltaHonesty.NoOpenDraft;
            response.CurrentDraftId = null;
            return response;
        }

        ArchitectureRequest projectedDraft = _draftRequestProjector.Project(
            draft.Document,
            detail.CurrentDraftId.Value);

        List<ArchitectureSealDeltaItem> diffs = ArchitectureSealDeltaComparer.Compare(
            sealedManifest,
            draft.Document,
            projectedDraft);

        response.Diffs = diffs;

        if (diffs.Count == 0)
            response.EmptyStateCopy = ArchitectureSealDeltaHonesty.NoChanges;

        return response;
    }
}
