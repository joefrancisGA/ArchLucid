using ArchLucid.Application.Architecture;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

public sealed partial class FindingAnalysisContextBuilder
{
    private async Task<PriorReviewSnapshots?> TryResolvePriorAsync(
        ScopeContext scope,
        Persistence.Models.RunRecord? header,
        ArchitectureRequest? request,
        CancellationToken cancellationToken)
    {
        if (header?.ArchitectureVersionId is not Guid currentVersionId || currentVersionId == Guid.Empty)
            return null;

        ArchitectureVersionRecord? currentVersion = await _architectureVersionRepository
            .GetByIdAsync(scope, currentVersionId, cancellationToken)
            .ConfigureAwait(false);

        if (currentVersion is null)
            return null;

        Guid? requestPriorRunId = request is null
            ? null
            : ArchitectureReviewSourceRunResolver.TryResolveSourceRunId(request);

        if (requestPriorRunId is Guid parsedRequestPriorRunId && parsedRequestPriorRunId != Guid.Empty)
        {
            Persistence.Models.RunRecord? requestPriorHeader =
                await _runRepository.GetByIdAsync(scope, parsedRequestPriorRunId, cancellationToken).ConfigureAwait(false);

            if (requestPriorHeader is not null)
            {
                return BuildPriorSnapshots(requestPriorHeader, parsedRequestPriorRunId);
            }
        }

        if (currentVersion.VersionNumber <= 1)
            return null;

        ArchitectureVersionRecord? predecessor = await _architectureVersionRepository
            .GetByArchitectureIdAndVersionNumberAsync(
                scope,
                currentVersion.ArchitectureId,
                currentVersion.VersionNumber - 1,
                cancellationToken)
            .ConfigureAwait(false);

        if (predecessor is null)
            return null;

        Guid? priorRunId = await _runRepository
            .GetLatestCommittedRunIdByArchitectureVersionIdAsync(scope, predecessor.ArchitectureVersionId, cancellationToken)
            .ConfigureAwait(false);

        if (priorRunId is not Guid parsedPriorRunId || parsedPriorRunId == Guid.Empty)
            return null;

        Persistence.Models.RunRecord? priorHeader =
            await _runRepository.GetByIdAsync(scope, parsedPriorRunId, cancellationToken).ConfigureAwait(false);

        if (priorHeader is null)
            return null;

        return BuildPriorSnapshots(priorHeader, parsedPriorRunId);
    }

    private static PriorReviewSnapshots BuildPriorSnapshots(
        Persistence.Models.RunRecord priorHeader,
        Guid priorRunId) =>
        new()
        {
            PriorArchitectureVersionId = priorHeader.ArchitectureVersionId,
            PriorGraphSnapshotId = priorHeader.GraphSnapshotId,
            PriorFindingsSnapshotId = priorHeader.FindingsSnapshotId,
            PriorRunId = priorRunId,
            PriorPinnedPolicyPackIdsHashSha256Hex =
                RunHeaderPinFingerprint.ToHexOrNull(priorHeader.PinnedPolicyPackIdsHashSha256),
            PriorPinnedEvidencePackagePinsHashSha256Hex =
                RunHeaderPinFingerprint.ToHexOrNull(priorHeader.PinnedEvidencePackagePinsHashSha256),
            PriorPinnedArchitectureVersionContentHashSha256Hex =
                RunHeaderPinFingerprint.ToHexOrNull(priorHeader.PinnedArchitectureVersionContentHashSha256),
            PriorPinnedKnowledgeModelContentHashSha256Hex =
                RunHeaderPinFingerprint.ToHexOrNull(priorHeader.PinnedKnowledgeModelContentHashSha256),
            PriorPinnedFocusedPilotModeEnabled =
                RunHeaderFocusedPilotPinFingerprint.FormatModeEnabled(priorHeader.PinnedFocusedPilotModeEnabled),
            PriorPinnedFocusedPilotCloudProvider =
                RunHeaderFocusedPilotPinFingerprint.FormatCloudProvider(priorHeader.PinnedFocusedPilotCloudProvider),
        };
}
